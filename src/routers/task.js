const express = require('express')
const Tasks = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()


router.post('/tasks', auth, async (req, res) => {
    //const task = new Tasks(req.body)
    const task = new Tasks({
        ...req.body,
        userId: req.user._id
    })

    try {
        await task.save()
        res.send(task)

    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/tasks', auth, async (req, res) => {
    const match = {}
    if(req.query.completed) {
        match.completed = req.query.completed === 'true'
    }
    try {
        //const tasks = await Tasks.find({ userId: req.user._id }) //this one also work for logged in user tasks
       await req.user.populate({
           path: 'userTasks',
           match,
           options: {
               limit: parseInt(req.query.limit),
               skip: parseInt(req.query.skip)
           }
       }).execPopulate()
        res.send(req.user.userTasks)
    } catch (e) {
        res.status(500).send()
    }

    // Tasks.find({}).then((tasks) => {
    //     res.send(tasks)
    // }).catch((e) => {
    //     res.status(500).send()
    // })
})

router.get('/task/:id', auth, async (req, res) => {
    const id = req.params.id

    try {
        //const task = await Tasks.findById(id)
        const task = await Tasks.findOne({ _id: id, userId: req.user._id })
        if(!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
    // Tasks.findById(id).then((task) => {
    //     if(!task) {
    //         return res.status(404).send()
    //     }

    //     res.send(task)
    // }).catch((e) => {
    //     res.status(500).send()
    // })
})

router.patch('/task/:id', auth, async (req, res) => {
    const keys = Object.keys(req.body)
    const allowedKeys = ['description', 'completed']
    const isValidOperation = keys.every((key) => allowedKeys.includes(key))

    if(!isValidOperation) {
        return res.status(404).send({error: 'Invalid updates'})
    }

    try {
        //const task = await Tasks.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
       // const task = await Tasks.findByIdAndUpdate(req.params.id) 
       const task = await Tasks.findOne({ _id: req.params.id, userId: req.user._id }) //using authentication
        
       if (!task) {
            return res.status(400).send()
        }
        keys.forEach((key) => task[key] = req.body[key])
        await task.save()
        res.send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/task/:id', auth, async (req, res) => {
    try {
        //const deletedTask = await Tasks.findByIdAndDelete(req.params.id)
        const deletedTask = await Tasks.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
        if(!deletedTask) {
            return res.status(404).send()
        }
        res.send(deletedTask)
    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router