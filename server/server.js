const path = require('path')
const http = require('http');
const { createClient } = require('redis');
const express = require('express')
const socketIO = require('socket.io');
const { generateMessage, generateLocationMessage } = require('./utils/message');
const { isRealString } = require('./utils/isRealString');
const { Users } = require('./utils/users');
// const { initializeApp } = require('firebase/app');
// const { getAnalytics } = require('firebase/analytics');

const publicPath = path.join(__dirname, '/../public')
const port = process.env.PORT || 3000;
const clientRedis = createClient({
    password: 'P82JxfsMaoQ3DDgiTVlcJCXs8FGvyvVx',
    socket: {
        host: 'redis-19450.c292.ap-southeast-1-1.ec2.cloud.redislabs.com',
        port: 19450
    },
});

// const firebaseConfig = {
//     apiKey: "AIzaSyDGSmX09O1X4Hxr0kCuauxSvBSZBAuU4qU",
//     authDomain: "socketionodejs.firebaseapp.com",
//     projectId: "socketionodejs",
//     storageBucket: "socketionodejs.appspot.com",
//     messagingSenderId: "977813872817",
//     appId: "1:977813872817:web:8a81f7171d554babc8c290",
//     measurementId: "G-TV1EDNBZQW"
// };

let app = express();
let server = http.createServer(app);
let io = socketIO(server);
// let fireApp = initializeApp(firebaseConfig);
// let analytics = getAnalytics(fireApp);
let users = new Users();
let mess = [];
var connect = false;

app.use(express.static(publicPath));

io.on('connection', (socket) => {
    console.log('New User Connected');

    socket.on('init', async (params, callback) => {
        // connect = await clientRedis.connect();
        // var currentMessage = await clientRedis.get(params.room, JSON.stringify(mess));
        // if (await clientRedis.disconnect()) {
        //     connect = false;
        // }
        // var parseJson = await JSON.parse(currentMessage);
        // mess = [];
        // await parseJson.forEach(function (val, index) {
        //     mess.push(val);
        //     io.to(params.room).emit('newMessage', generateMessage(val.from, val.text));
        // });


    });



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

    socket.on('createMessage', async (message, callback) => {
        let user = users.getUser(socket.id);

        if (user && isRealString(message.text)) {
            io.to(user.room).emit('newMessage', generateMessage(user.name, message.text));
            mess.push(generateMessage(user.name, message.text));

            await clientRedis.connect();
            await clientRedis.set(user.room, JSON.stringify(mess));
            await clientRedis.disconnect();
        }
        callback('This is the server:');
    })

    socket.on('createLocationMessage', async (coords) => {
        let user = users.getUser(socket.id);

        if (user) {
            io.to(user.room).emit('newLocationMessage', generateLocationMessage(user.name, coords.lat, coords.lng))

            mess.push(generateLocationMessage(user.name, coords.lat, coords.lng));

            await clientRedis.connect();
            await clientRedis.set(user.room, JSON.stringify(mess));
            await clientRedis.disconnect();
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