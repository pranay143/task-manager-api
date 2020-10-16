const { Router } = require('express')
const express = require('express')
const multer = require('multer')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, cancelationEmail } = require('../emails/account')
const router = new express.Router()

//create request
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.eMail, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
    // user.save().then(() => {
    //     res.send(user)
    // }).catch((e) => {
    //     res.status(400).send(e)
    // })
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.eMail, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })

        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }

})

router.get('/users/me', auth, async (req, res) => {

    res.send(req.user)
    //  try {
    //     const users = await User.find({})
    //      res.send(users)
    //  } catch (e) {
    //     res.status(500).send()
    //  }

})

router.get('/user/:id', async (req, res) => {
    const id = req.params.id

    try {
        const user = await User.findById(id)
        if(!user) {
            return res.status(404).send() 
        }
        res.send(user)
    } catch (e) {
        res.status(500).send()
    }

})

router.patch('/users/me', auth, async (req, res) => {
    const keys = Object.keys(req.body)
    const allowedKeys = ['name', 'eMail', 'password', 'age']
    const isValidOperation = keys.every((key) => allowedKeys.includes(key))

    if(!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates'})
    }

    try {
        //const user = await User.findByIdAndUpdate(req.params.id)
        keys.forEach((key) => req.user[key] = req.body[key])
        await req.user.save()
       // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
       
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/user/me', auth, async (req, res) => {
    try {
       await req.user.remove()
       cancelationEmail (req.user.eMail, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpeg|jpg|png)$/)) {
            return cb(new Error('Please upload image'))
        }

        cb(undefined, true)
    }
})

router.post('/upload/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    req.user.avatar = req.file.buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/upload/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send({ status: 'Deleted' })
})

module.exports = router