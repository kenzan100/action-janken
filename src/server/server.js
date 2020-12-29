const express = require('express');
const socketio = require('socket.io');

// Spin up server
const app = express();
app.use(express.static('dist'));

const port = process.env.PORT || 3000;
const server = app.listen(port);
console.log(`server listening on port ${port}`);

const gameState = {
    players: [
        {
            id: 'xyz',
            x: 30,
            y: 30,
        },
    ],
    coins: [
        {
            kind: 'Rock',
            x: 100,
            y: 100,
        },
    ],
};

const gameLogic = {
    sockets: {},

    start () {
        setInterval(this.update.bind(this), 1000 / 60);
    },

    joinGame(socket) {
        this.sockets[socket.id] = socket;
    },

    update() {
        Object.values(this.sockets).forEach(socket => {
            socket.emit('gameUpdate', gameState);
        });
    },
};

// Socket
const io = socketio(server);
io.on('connection', socket => {
    console.log('player connected', socket.id);
    gameLogic.joinGame(socket);
});

gameLogic.start();
