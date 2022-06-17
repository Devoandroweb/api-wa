const {
    Client,
    LocalAuth
} = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require("express");
const socketIO = require("socket.io");
const app = express();

const http = require("http");
const {
    response
} = require('express');

const port = process.env.PORT || 8000;
const server = http.createServer(app);

const io = socketIO(server);


app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
    }
});
var auth = false;
client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, {
        small: true
    });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', message => {
    if (
        message.body === "Assalamu'alaikum" || 
        message.body === "Assalamualaikum" || 
        message.body === "Mas" || 
        message.body === "mas" ||
        message.body === "Den" ||
        message.body === "den"
        ) {
            if (message.body == "Mas" || message.body == "mas" || message.body === "den" || message.body === "Den") {
                message.reply('Iya, mohon ditunggu saya akan segera membalas');
            }else{
                message.reply('*Waalaikumsalam*, mohon ditunggu saya akan segera membalas');
            }
        //client.sendMessage("62895804190103@c.us", "Hallo");
    }
});

// API
app.get('/send-message', (req, res) => {
    const checkRegistered = async function (number) {
        const isRegistered = await client.isRegisteredUser(number)
        return isRegistered;
    }


    var number = req.query.number;
    var message = req.query.msg;
    message = message.split('{ENTER}').join('%0a');
    // var number = "62895804190103@c.us";
    // var message = "Tes Api Wa";
    //Tes %0a Api Wa %0a = break
    const isRegisteredNumber = checkRegistered(number)

    if (!isRegisteredNumber) {
        return res.status(422).json({
            status: false,
            message: "Nomor tidak terdaftar"
        })
    }
    client.sendMessage(number, message).then(response => {
        res.status(200).json({
            status: true,
            response: response
        })
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: err
        })
    });
});



client.initialize();
server.listen(port, function () {
    console.log("App running ... ");
});

//SCOKET
io.on('connection', onConnect);

function onConnect(socket) {
    console.log('Connected');
}