import io from 'socket.io-client';

// Connect to your Go server
const socket = io("http://localhost:8081?userId=1", {
  transports: ["websocket"],
  withCredentials: true,
});

// console.log(socket);
// socket.on('connect', () => {
//   console.log('Connected! Socket ID:', socket.id);

//   // Send a message event
//   socket.emit('message', 'Hello from Node.js client!');
// });

socket.on('message', (msg) => {
  console.log('Received message:', msg);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('connect_error', (err) => {
  console.error('Connect error:', err);
});

socket.on('error', (err) => {
  console.error('Socket error:', err);
});