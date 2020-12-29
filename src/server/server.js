const express = require('express');
const socketio = require('socket.io');

// Spin up server
const app = express();
app.use(express.static('dist'));

const port = process.env.PORT || 3000;
const server = app.listen(port);
console.log(`server listening on port ${port}`);

const gameLogic = {
    sockets: {},
    players: {},
    coins: [],

    start () {
        setInterval(this.update.bind(this), 1000 / 60);
    },

    joinGame(socket) {
        this.sockets[socket.id] = socket;
        this.players[socket.id] = { dx: 0, dy: 0, x: 10, y: 10 };
    },

    updatePlayer({ dx, dy }, socketId) {
        const player = this.players[socketId];
        player.dx = dx;
        player.dy = dy;
    },

    placeCoin({ kind }, socketId) {
        const player = this.players[socketId];
        const newCoin = { x: player.x, y: player.y, kind: kind, parentId: socketId };
        this.coins.push(newCoin);
    },

    update() {
        Object.values(this.players).forEach(player => {
            player.x += player.dx;
            player.y += player.dy;
        });

        Object.values(this.sockets).forEach(socket => {
            socket.emit('gameUpdate', this.currentState());
        });
    },

    currentState() {
        return {
            players: this.players,
            coins: this.coins,
        };
    },
};

// Socket
const io = socketio(server);
io.on('connection', socket => {
    console.log('player connected', socket.id);
    gameLogic.joinGame(socket);
    socket.on('playerMove', (update) => {
        gameLogic.updatePlayer(update, socket.id);
    });
    socket.on('coinPlace', (update) => {
        gameLogic.placeCoin(update, socket.id);
    });
});

gameLogic.start();
