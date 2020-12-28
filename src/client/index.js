import io from 'socket.io-client';

console.log('Hello');

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

let x = 10;
let y = 10;
let dx = 0;
let dy = 0;

function draw_ball(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI*2, false);
    ctx.fillStyle = "green";
    ctx.fill();
    ctx.closePath();
}

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

const renderer = {
    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        x += dx;
        y += dy;
        draw_ball(x, y);
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
            this.socket.on('update', syncUpdate);
        });
    },
};

// Main initialization
sockets.init();
document.addEventListener("keydown", inputs.keyDownHandler.bind(inputs), false);
setInterval(renderer.render, 1000/60);
