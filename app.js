const {
    Client, LocalAuth, LegacySessionAuth
} = require('whatsapp-web.js');
var favicon = require('serve-favicon');
var path = require('path');
const qrcode = require('qrcode');
const fs = require('fs');
const express = require("express");
const app = express();
const socketIO = require("socket.io");
const http = require("http");
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

const SESSION_FILE_PATH = './session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}
const client = new Client({
    puppeteer: {
        headless: true
    },
    authStrategy: new LegacySessionAuth(),
    session: sessionCfg
});


app.get("/", (req, res) => {
    res.sendFile("index.html", {
        root: __dirname
    });
});
app.use(favicon(path.join(__dirname, '/', 'favicon.ico')))
client.on('message', msg => {
    if (msg.body == 'mas') {
        msg.reply('sedang sibuk mohon tunggu ... *[Bot Whatsapp by Rossi]*');
    }
});

client.initialize();
process.setMaxListeners(0);
io.on('connection', function (socket) {
    socket.emit('message', 'Connecting ... ');
    if (sessionCfg) {
        // console.log('Session', sessionCfg);
        socket.emit('message', 'Ready ');

    }
    client.on('qr', (qr) => {
        // Generate and scan this code with your phone
        console.log('QR RECEIVED', qr);
        qrcode.toDataURL(qr, (err, url) => {
            socket.emit('qr', url);
            socket.emit('message', 'QR Code accepted ... ');
        });
    });

    client.on('ready', () => {
        socket.emit('ready', 'Whatsapp is ready!');
        socket.emit('message', 'Whatsapp is ready!');
    });

    client.on('authenticated', (session) => {
        socket.emit('ready', 'Whatsapp is authenticated!');
        socket.emit('message', 'Whatsapp is authenticated!');
        console.log('AUTHENTICATED', session);
        sessionCfg = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
            if (err) {
                console.error(err);
            } else {
                socket.emit('ready', 'Whatsapp is ready!');
            }
        });
    });
});

//API WA
app.post('/send-message', (req, res) => {
    const number = req.body.number;
    const message = req.body.message;
    for (var i = 0; i < 3; i++) {
        client.sendMessage(number, message).then(response => {
            res.status(200).json({
                status: true,
                response: response
            });
        }).catch(err => {
            res.status(500).json({
                status: false,
                response: err
            });
        });
    };

});

server.listen(8000, function () {
    console.log("App running ... ");
});