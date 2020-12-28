const express = require('express');
const socketio = require('socket.io');

// Spin up server
const app = express();
app.use(express.static('dist'));

const port = process.env.PORT || 3000;
const server = app.listen(port);
console.log(`server listening on port ${port}`);

// Socket
const io = socketio(server);
io.on('connection', socket => {
    console.log('player connected', socket.id);
});
