import io from 'socket.io-client';

console.log('Hello');

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

const inputs = {
    keyDownActions: {
        'ArrowLeft':  { dx: -2, dy: 0 },
        'ArrowRight': { dx:  2, dy: 0 },
        'ArrowUp':    { dy: -2, dx: 0 },
        'ArrowDown':  { dy:  2, dx: 0 },

        'r': { kind: 'Rock' },
        'p': { kind: 'Paper' },
        's': { kind: 'Scissor' },
    },

    keyDownHandler(e) {
        let val = e.key;
        const vals = this.keyDownActions[val];
        if (vals) {
            if (vals.kind) {
                this.emitCoinPlace(vals);
            } else {
                this.emitMove(vals);
            }
        };
    },

    emitMove({ dx, dy }) {
        sockets.socket.emit('playerMove', { dx, dy });
    },

    emitCoinPlace({ kind }) {
        sockets.socket.emit('coinPlace', { kind });
    },
};

const drawer = {
    draw_circle(x, y, color, radius) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI*2, false);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
    }
};

const renderer = {
    gameUpdate: null,
    match: null,

    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.match) {
            if (this.match.loser.socketId == sockets.socket.id) {
                console.log("You lose!");
            } else if (this.match.winner.socketId == sockets.socket.id) {
                console.log("You win!");
            };
            this.match = null;
        }

        const update = this.gameUpdate;

        update.coins.forEach(coin => {
            this.draw_coin(coin.x, coin.y, coin.kind);
        });

        Object.values(update.players).forEach(player => {
            this.draw_player(player.x, player.y, player.state);
        });
    },

    draw_coin(x, y, kind) {
        drawer.draw_circle(x, y, 'green', 10);
    },

    draw_player(x, y, state) {
        const map = { Rock: 'green', Paper: 'blue', Scissor: 'yellow' };
        drawer.draw_circle(x, y, map[state], 30);
    },
};

const sockets = {
    sockets: null,

    init() {
        const socketProtocol = (window.location.protocol.includes('https')) ? 'wss' : 'ws';
        this.socket = io(`${socketProtocol}://${window.location.host}`, { reconnection: false });
        this.registerConnection();
    },

    registerConnection() {
        const connectedPromise = new Promise(resolve => {
            this.socket.on('connect', () => {
                console.log('client connected to server');
                resolve();
            });
        });

        connectedPromise.then(() => {
            const syncUpdate = (update) => renderer.gameUpdate = update;
            const syncMatch = (match) => renderer.match = match;
            this.socket.on('gameUpdate', syncUpdate);
            this.socket.on('match', syncMatch);
        });
    },
};

// Main initialization
sockets.init();
document.addEventListener("keydown", inputs.keyDownHandler.bind(inputs), false);
setInterval(renderer.render.bind(renderer), 1000/60);
