//inisisalisai variable
const {
    Client,
    LocalAuth
} = require('whatsapp-web.js');
const qrcode_terminal = require('qrcode-terminal');
const qrcode = require('qrcode');
const express = require("express");
const socketIO = require("socket.io");
const app = express();
const http = require("http");
const {response} = require('express');
const port = process.env.PORT || 8000;
const server = http.createServer(app);
const io = socketIO(server);
const fs = require('fs');
var favicon = require('serve-favicon');
var path = require('path');




app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
         headless: true,
         args: [
             '--no-sandbox',
             '--disable-setuid-sandbox',
             '--disable-dev-shm-usage',
             '--disable-accelerated-2d-canvas',
             '--no-first-run',
             '--no-zygote',
             '--single-process', // <- this one doesn't works in Windows
             '--disable-gpu'
         ],
     },
    authStrategy: new LocalAuth(),
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode_terminal.generate(qr, {
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


var rimraf = require("rimraf");
rimraf(".wwebjs_auth", function () {
    console.log("done");
});

client.on('disconnected', (reason) => {
    // Destroy and reinitialize the client when disconnected
    
    rimraf(".wwebjs_auth", function () {
        console.log("done");
    });

    client.destroy();
    client.initialize();
});

//HTML -------------------------------------------------------------------------------------
app.get("/", (req, res) => {
    res.sendFile("index.html", {
        root: __dirname
    });
});
app.use(favicon(path.join(__dirname, '/', 'favicon.ico')))
// -----------------------------------------------------------------------------------------
// API -------------------------------------------------------------------------------------
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
// -----------------------------------------------------------------------------------------
client.initialize();
var login = false;
// IO --------------------------------------------------------------------------------------
io.on('connection', function (socket) {

    socket.emit('message', 'Connecting...');
    if(login){
        socket.emit('message', 'Whatsapp is ready!');
    }
    client.on('qr', (qr) => {
        console.log('QR RECEIVED', qr);
        qrcode.toDataURL(qr, (err, url) => {
            socket.emit('qr', url);
            socket.emit('message', 'QR Code received, scan please!');
        });
    });

    client.on('ready', () => {
        login = true;
        socket.emit('ready', 'Whatsapp is ready!');
        socket.emit('message', 'Whatsapp is ready!');
    });

    client.on('authenticated', () => {
        socket.emit('authenticated', 'Whatsapp is authenticated!');
        socket.emit('message', 'Whatsapp is authenticated!');
        console.log('AUTHENTICATED');
    });

    client.on('auth_failure', function (session) {
        socket.emit('message', 'Auth failure, restarting...');
    });

    client.on('disconnected', (reason) => {
        login = false;
        socket.emit('message', 'Whatsapp is disconnected!');
        client.destroy();
        client.initialize();
    });
});
// ------------------------------------------------------------------------------------------

process.setMaxListeners(0);
server.listen(port, function () {
    client.initialize();
    console.log("App running ... ");
});