require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const braintree = require('braintree');

const app = express();
app.use(cors());
app.use(bodyParser.json());

var gateway = new braintree.BraintreeGateway({
    environment:  braintree.Environment.Sandbox,
    merchantId:   'tztv9gt8364n2947',
    publicKey:    '6bj6w4csgbgkvk9n',
    privateKey:   '45321d1ebe5ffb6e39d06f544bf78df6'
});
console.log(process.env.BRAINTREE_MERCHANT_ID);
console.log(process.env.BRAINTREE_PUBLIC_KEY);
console.log(process.env.BRAINTREE_PRIVATE_KEY);


app.get('/client_token', (req, res) => {
    gateway.clientToken.generate({}, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(response.clientToken);
        }
    });
});

app.post('/checkout', (req, res) => {
    const nonceFromTheClient = req.body.paymentMethodNonce;
    const amount = req.body.amount;

    gateway.transaction.sale({
        amount: amount,
        paymentMethodNonce: nonceFromTheClient,
        options: {
            submitForSettlement: true
        }
    }, (err, result) => {
        if (err || !result.success) {
            res.status(500).send(err || result.message);
        } else {
            res.send(result);
        }
    });
});

app.post('/send-report', (req, res) => {
    const { email, report } = req.body;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Vehicle Report',
        text: 'Attached is your vehicle report.',
        html: `<h1>Vehicle Report</h1><pre>${JSON.stringify(report, null, 2)}</pre>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Error sending email: ' + error);
        }
        res.send('Email sent: ' + info.response);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
