const sgMail = require('@sendgrid/mail')

//const sendGridAPI = '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'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send ({
        to: email,
        from: 'pranaykumarlabba@gmail.com',
        subject: 'Thanks for joining in',
        text: `Welcome to the Task Manager App , ${name}` 
    })
}

const cancelationEmail = (email, name) => {
    sgMail.send ({
        to: email,
        from: 'pranaykumarlabba@gmail.com',
        subject: 'Sorry to see you go',
        text: `Goodbye ${name}. I hope to see you again.`
    })
}

module.exports = {
    sendWelcomeEmail,
    cancelationEmail
}