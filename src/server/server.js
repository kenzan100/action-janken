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
            state: 'Rock', Rock: 0, Paper: 0, Scissor: 0,
            socketId: socket.id,
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

        const match = this.applyPlayerCollision();
        if (match) {
            this.sockets[match.winner.socketId].emit('match', match);
            this.sockets[match.loser.socketId].emit('match', match);
        };

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

    applyPlayerCollision() {
        let match = null;

        Object.keys(this.players).forEach(p1_key => {
            Object.keys(this.players).forEach(p2_key => {
                if (p1_key === p2_key) { return; };

                const p1 = this.players[p1_key];
                const p2 = this.players[p2_key];
                if (this.closeEnough(p1.x, p1.y, p2.x, p2.y, 30)) {
                    match = this.rock_paper_scissors(p1, p2);
                }
            });
        });

        return match;
    },

    closeEnough(x1, y1, x2, y2, threshold) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= threshold;
    },

    rock_paper_scissors(p1, p2) {
        const table = {
            Rock:  { Rock: 'tie', Paper: 'lose', Scissor: 'win' },
            Paper: { Rock: 'win', Paper: 'tie', Scissor: 'lose' },
            Scissor: { Rock: 'lose', Paper: 'win', Scissor: 'tie' },
        };

        if (table[p1.state]) {
            const p1_win_lose = table[p1.state][p2.state];
            if (p1_win_lose === 'win') {
                return { winner: p1, loser: p2 };
            } else if (p1_win_lose === 'lose') {
                return { winner: p2, loser: p1 };
            }
        }
        return null;
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
