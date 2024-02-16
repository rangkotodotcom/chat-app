const path = require('path')
const http = require('http');
const express = require('express')
const socketIO = require('socket.io');
const { generateMessage, generateLocationMessage } = require('./utils/message');
const { isRealString } = require('./utils/isRealString');
const { Users } = require('./utils/users');
const { initializeApp } = require('firebase/app');
const { getAnalytics } = require('firebase/analytics');

const publicPath = path.join(__dirname, '/../public')
const port = process.env.PORT || 3000;

const firebaseConfig = {
    apiKey: "AIzaSyDGSmX09O1X4Hxr0kCuauxSvBSZBAuU4qU",
    authDomain: "socketionodejs.firebaseapp.com",
    projectId: "socketionodejs",
    storageBucket: "socketionodejs.appspot.com",
    messagingSenderId: "977813872817",
    appId: "1:977813872817:web:8a81f7171d554babc8c290",
    measurementId: "G-TV1EDNBZQW"
};

let app = express();
let server = http.createServer(app);
let io = socketIO(server);
let fireApp = initializeApp(firebaseConfig);
let analytics = getAnalytics(fireApp);
let users = new Users();

app.use(express.static(publicPath));

io.on('connection', (socket) => {
    console.log('New User Connected');

    socket.on('join', (params, callback) => {
        if (!isRealString(params.name) || !isRealString(params.room)) {
            return callback('Name and room are required');
        }

        socket.join(params.room);
        users.removeUser(socket.id);
        users.addUser(socket.id, params.name, params.room);

        io.to(params.room).emit('updateUsersList', users.getUserList(params.room));
        socket.emit('newMessage', generateMessage('Admin', `Welocome to ${params.room}!`));

        socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin', "New User Joined!"));

        callback();
    })

    socket.on('createMessage', (message, callback) => {
        let user = users.getUser(socket.id);

        if (user && isRealString(message.text)) {
            io.to(user.room).emit('newMessage', generateMessage(user.name, message.text));
        }
        callback('This is the server:');
    })

    socket.on('createLocationMessage', (coords) => {
        let user = users.getUser(socket.id);

        if (user) {
            io.to(user.room).emit('newLocationMessage', generateLocationMessage(user.name, coords.lat, coords.lng))
        }
    })

    socket.on('disconnect', () => {
        let user = users.removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('updateUsersList', users.getUserList(user.room));
            io.to(user.room).emit('newMessage', generateMessage('Admin', `${user.name} has left ${user.room} chat room.`))
        }
    });
});



server.listen(port, () => {
    console.log(`Server is up port ${port}`);
});