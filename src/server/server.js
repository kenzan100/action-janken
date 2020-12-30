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
        this.players[socket.id] = {
            dx: 0, dy: 0, x: 10, y: 10,
            state: 'Rock', Rock: 0, Paper: 0, Scissor: 0
        };
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
        const coinsToRemove = this.applyCoinCollision();
        this.coins = this.coins.filter(coin => !coinsToRemove.get(coin));

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

    applyCoinCollision() {
        const coinsToRemove = new Map();
        this.coins.forEach(coin => {
            Object.keys(this.players).forEach(key => {
                const player = this.players[key];
                if (this.closeEnough(player.x, player.y, coin.x, coin.y, 30)) {
                    player[coin.kind] += 1;
                    player.state = this.setState(player);
                    coinsToRemove.set(coin, true);
                }
            });
        });

        return coinsToRemove;
    },

    closeEnough(x1, y1, x2, y2, threshold) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= threshold;
    },

    setState(player) {
        const rps = { Rock: player.Rock, Paper: player.Paper, Scissor: player.Scissor };
        const max = Math.max.apply(null, Object.values(rps));
        const idx = Object.values(rps).indexOf(max);

        return Object.keys(rps)[idx];
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
