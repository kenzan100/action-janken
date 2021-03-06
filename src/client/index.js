import io from 'socket.io-client';

console.log('Hello');

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

// Images to draw
const rockImage = document.getElementById('rock_img');
const paperImage = document.getElementById('paper_img');
const scissorImage = document.getElementById('scissor_img');

const coinRockImage = document.getElementById('coin_rock_img');
const coinPaperImage = document.getElementById('coin_paper_img');
const coinScissorImage = document.getElementById('coin_scissor_img');

// Game status display
const winLoseMenu = document.getElementById('win-lose-menu');
const yourState = document.getElementById('your-state');
const opponentState = document.getElementById('opponent-state');
const winLoseResult = document.getElementById('win-lose-result');


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
    imageMap:  { Rock: rockImage, Paper: paperImage, Scissor: scissorImage },
    coinImageMap:  { Rock: coinRockImage, Paper: coinPaperImage, Scissor: coinScissorImage },

    draw_coin(x, y, kind) {
        ctx.setTransform(1,0,0,1,x,y);

        const img = this.coinImageMap[kind];
        ctx.drawImage(img, -img.width/2, -img.height/2);

        ctx.setTransform(1,0,0,1,0,0);
    },

    draw_player(x, y, state) {
        ctx.setTransform(1,0,0,1,x,y);

        const img = this.imageMap[state];
        ctx.drawImage(img, -img.width/4, -img.height/2);

        ctx.setTransform(1,0,0,1,0,0);
    },
};

const renderer = {
    gameUpdate: null,
    match: null,
    currentInterval: null,

    start() {
        this.currentInterval = setInterval(this.render.bind(this), 1000/60);
    },

    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.match) {
            this.fillInfoToWinLoseMenu(this.match);
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
        drawer.draw_coin(x, y, kind);
    },

    draw_player(x, y, state) {
        drawer.draw_player(x, y, state);
    },

    fillInfoToWinLoseMenu(match) {
        const updates = this.gameUpdate;
        const socket = sockets.socket;
        const opponent = match.winner.socketId == socket.id ? match.loser : match.winner;

        yourState.textContent = updates.players[socket.id].state;
        opponentState.textContent = opponent.state;

        if (opponent.socketId === match.winner.socketId) {
            winLoseResult.textContent = "You Lost...";
            socket.disconnect();
            clearInterval(this.currentInterval);
        } else {
            winLoseResult.textContent = "You Beat another player! Keep going!";
            setTimeout(() => winLoseMenu.classList.add('hidden'), 2000);
        }

        winLoseMenu.classList.remove('hidden');
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
renderer.start();
