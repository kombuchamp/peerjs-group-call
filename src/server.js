const path = require('path');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const socketio = require('socket.io')(server);
const { v4: uuid } = require('uuid');

const { PeerServer } = require('peer');
const peerServer = PeerServer({ port: 3003, path: '/peerjs' });

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.redirect(`/${
            uuid()
        }`);
});

app.get('/:room', (req, res) => {
    res.sendFile('room.html', {
        root: 'public',
    });
});

socketio.on('connection', socket => {
    socket.on('join', (roomId, userId) => {
        console.info(`Room ${roomId}: user ${userId} is joined`);
        socket.join(roomId);
        socket.to(roomId).broadcast.emit('user-connected', userId);
        socket.on('disconnect', () => {
            console.info(`Room ${roomId}: user ${userId} has disconnected`);
            socket.to(roomId).broadcast.emit('user-disconnected', userId);
            socket.leave(roomId);
        });
    });
});

server.listen(3001);