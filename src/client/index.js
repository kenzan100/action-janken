import io from 'socket.io-client';

console.log('Hello');

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

let x = 10;
let y = 10;
let dx = 0;
let dy = 0;

const inputs = {
    keyDownActions: {
        'Left':  () => { dx = -2; dy = 0; },
        'Right': () => { dx =  2; dy = 0; },
        'Up':    () => { dy = -2; dx = 0; },
        'Down':  () => { dy =  2; dx = 0; },
    },

    keyDownHandler(e) {
        let val = e.key.replace('Arrow', '');
        const fn = this.keyDownActions[val];
        if (typeof fn == 'function') {
            fn();
        };
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

    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const update = this.gameUpdate;

        update.coins.forEach(coin => {
            this.draw_coin(coin.x, coin.y, coin.kind);
        });

        update.players.forEach(player => {
            this.draw_player(player.x, player.y);
        });
    },

    draw_coin(x, y, kind) {
        drawer.draw_circle(x, y, 'green', 10);
    },

    draw_player(x, y) {
        drawer.draw_circle(x, y, 'green', 30);
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
            this.socket.on('gameUpdate', syncUpdate);
        });
    },
};

// Main initialization
sockets.init();
document.addEventListener("keydown", inputs.keyDownHandler.bind(inputs), false);
setInterval(renderer.render.bind(renderer), 1000/60);
