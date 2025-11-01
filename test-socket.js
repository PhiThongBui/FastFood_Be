const io = require('socket.io-client');

console.log('Connecting to Socket.IO server...');

const socket = io('http://localhost:5000/notifications', {
    transports: ['websocket'],
    reconnection: true,
});

socket.on('connect', () => {
    console.log('✅ Connected! Socket ID:', socket.id);
});

socket.on('connected', (data) => {
    console.log('📩 Server says:', data);
});

socket.on('new_order', (notification) => {
    console.log('🔔 NEW ORDER:', notification);
});

socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected:', reason);
});

socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
});

// Keep alive
process.on('SIGINT', () => {
    console.log('\nDisconnecting...');
    socket.disconnect();
    process.exit(0);
});
