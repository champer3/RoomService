const mongoose = require('mongoose')
const http = require('http');
const dotenv = require('dotenv')
const express = require('express')
const app = require('./app');
// const server = http.createServer(express());
const server = http.createServer(app);
const io = require('socket.io')(server)
// const io = require('socket.io')(app)
dotenv.config({ path: './config.env' })
const jwt = require("jsonwebtoken");
const authController = require("./controllers/authController")
const orderController = require("./controllers/orderController");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');
const { runAssistant } = require('./controllers/aiController');


let socketID = {}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/audio'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.m4a';
    cb(null, `recording-${Date.now()}${ext}`);
  },
});
app.post('/ai-assistant', async (req, res) => {
  try {
    const { message, products, history } = req.body;
    console.log(req.body)
    const aiResult = await runAssistant(message, products, history);

    // 4️⃣ Respond with transcript + AI reply/actions
    res.json({
      success: true,
      transcript: text,
      reply: aiResult.reply,
      actions: aiResult.actions
    });
    // aiResult: { reply, actions: { addToCart, suggestProducts } }

    res.json(aiResult);
  } catch (err) {
    console.error('AI assistant text error:', err);
    res.status(500).json({
      reply: "I had trouble understanding that. Please try again.",
      actions: { addToCart: [], suggestProducts: [] }
    });
  }
});
const upload = multer({ storage });

app.post('/api/v1/ai-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file uploaded' });
    }

    const audioPath = req.file.path;
    const fileStream = fs.createReadStream(audioPath);

    // 1️⃣ Transcribe
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'gpt-4o-transcribe',
    });

    console.log("Transcription result:", transcription);
    const text = transcription.text;

    // 2️⃣ Parse products from multipart form-data (sent as JSON string)
    let products = [];
    if (req.body.products) {
      try {
        products = JSON.parse(req.body.products);
      } catch (e) {
        console.warn('Failed to parse products from ai-audio body:', e);
      }
    }
    let history = [];
    if (req.body.history) {
      try {
        history = JSON.parse(req.body.history);
      } catch (e) {
        console.warn('Failed to parse history from ai-audio body:', e);
      }
    }

    // 3️⃣ Call shared assistant logic
    const aiResult = await runAssistant(text, products, history);

    // 4️⃣ Respond with transcript + AI reply/actions
    res.json({
      success: true,
      transcript: text,
      reply: aiResult.reply,
      actions: aiResult.actions
    });

    // 5️⃣ Optional: cleanup on disk
    fs.unlink(audioPath, () => {});
  } catch (err) {
    console.error('AI audio error:', err);
    res.status(500).json({ success: false, message: 'STT or AI failed' });
  }
});

const identifyUser = (socket, next) => {
  const token = socket.handshake.query.token;
  console.log("Token from middleware", token)
  if (!token) {
    return next(new Error('Unauthorized connection'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userID = decoded.id;
    socketID[decoded.id] = decoded.id
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
  console.log("Received Token")

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if (socket.userID && socketID[socket.userID]) {
      delete socketID[socket.userID]; // Remove socket ID on disconnect
    }
  });
  // socket.join(socket.userID)

  if(socket.handshake.query.role === 'admin'){
    console.log("The client that connected is an admin")
    socket.join('admin')
  } else{
    console.log('connected as a normal user')
    socket.join(socket.userID)
  }

  socket.on('order', (data) => {
    console.log('Received message:', data);
    socket.broadcast.emit('order', data);
  });

  // socket.on('orderInDelivery', (data) => {
  //   console.log('Received OrderInDelivery message:', data);
  //   socket.broadcast.emit('orderInDelivery', data);
  // });
});


app.patch("/api/v1/orders/deliver/:order", authController.protect, authController.restrictTo("admin", "owner", "driver"), orderController.deliverOrder, (req, res) => {
  console.log("sdsjdvnskndvjnskjdnvjknskjvkjsfbvkjbjfksvbjksbfkvjbkjfbvjk")
  const userID = req.order.userID.toString();
  const userSocketID = socketID[userID];
  console.log("We have a userSocketID", userSocketID)
  console.log('req.order.orderStatus', req.order.orderStatus)
  if (userSocketID) {
    if (req.order.orderStatus === 'Delivered'){
      console.log("THE ORDER IS NOW DELIVERED", req.order.orderStatus)
      io.to(socketID[req.order.userID.toString()]).emit('delivered', { message: "Your order has been delivered", orderId: req.order._id.toString()});
    } else if (req.order.orderStatus ==='Ready for Delivery'){
      console.log("THE ORDER HAS BEEN SENT OUT FOR DELIVERY", req.order.orderStatus)
      io.to(socketID[req.order.userID.toString()]).emit('orderInDelivery', { message: "Your order is out for delivery", orderId: req.order._id.toString() });
    }
  } else {
    console.log('User is not connected or no socket ID found')
  }

  res.status(200).json({
    status: "success",
    order: req.order,
  });
})
app.get('/print-jobs/tsp100iv', (req, res) => {
  // Example job - plain text
  console.log("Printing job")
  res.json({
    jobReady: true,
    jobId: 'job-123',
    job: {
      contentType: 'text/plain',
      data: 'Thanks for your order!\nOrder #1234\nTotal: $25.00\n'
    }
  });
});

const PORT1 = process.env.PORT || 3000; // For the first server
// const PORT2 = process.env.PORT2 || 5000; // For the second server

server.listen(PORT1, () => {
  console.log(`Server is running at http://localhost:${PORT1}`);
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

// app.listen(PORT2, () => {
//   console.log(`Server is running at http://localhost:${PORT2}`);
// });

module.exports = app