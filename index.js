const mongoose = require('mongoose')
const http = require('http');
const dotenv = require('dotenv')
const express = require('express')
const app = require('./app');
const server = http.createServer(express());
const io = require('socket.io')(server)
const jwt = require("jsonwebtoken");
const orderController = require("./controllers/orderController");

dotenv.config({ path: './config.env' })

let socketID



const identifyUser = (socket, next) => {
  const token = socket.handshake.query.token;
  console.log("Token from middleware", token)
  if (!token) {
    return next(new Error('Unauthorized connection'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userID = decoded.id;
    socketID = decoded.id
    next();
  } catch (err) {
    return next(new Error('Invalid token'));
  }
};

// Socket.IO setup
io.use(identifyUser);

io.on('connection', (socket) => {
  console.log('A client connected');
  const token = socket.handshake.query.token;
  console.log("Received Token", token)

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  socket.emit('update', { message: 'Now you get to know when the order is complete' })
  socket.join(socket.userID)

  socket.on('message', (data) => {
    console.log('Received message:', data);
    // Broadcast the message to all clients except the sender
    socket.broadcast.emit('message', data);
  });
});

app.patch("/api/v1/orders/deliver/:order", orderController.deliverOrder, (req, res) =>{

  if(req.order.userID.toString() === socketID){
    io.to(socketID).emit('delivered', {message: "Your order has been delivered"});
  } else{
    return res.status(400).json({
      status: "fail",
      message: "This user didn't make this order"
    })
  }

  res.status(200).json({
    status: "success",
    order: req.order,
  });
})


server.listen(process.env.PORT1, () => {
  console.log(`Server is running at http://localhost:5000`);
});

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);


mongoose
  .connect(DB, {
    // useNewUrlParser: true,
    dbName: 'RoomService'
    // useCreateIndex: true,
    // useFindAndModify: false
  })
  .then(() => console.log('DB connection successful!'));

app.listen(process.env.PORT, () => {
  console.log(`Server is running at http://localhost:${process.env.PORT}`);
});

module.exports = io