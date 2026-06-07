require('dotenv').config({ path: './.env' });

const mongoose = require('mongoose')
const http = require('http');
const express = require('express')
const app = require('./app');
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})
const jwt = require("jsonwebtoken");
const authController = require("./controllers/authController")
const orderController = require("./controllers/orderController");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');
const { runAssistant } = require('./controllers/aiController');
const { setIO, setSocketIDEntry, removeSocketIDEntry, getSocketID } = require('./socketManager');
const { sendPushToUser } = require('./pushService');

app.use(express.json());

setIO(io);
let socketID = getSocketID();
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
  const role = socket.handshake.query.role;
  console.log('[Socket Middleware] Connection attempt | role:', role || 'user', '| has token:', !!token);
  
  if (!token) {
    console.log('[Socket Middleware] REJECTED - no token provided');
    return next(new Error('Unauthorized connection'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userID = decoded.id;
    setSocketIDEntry(decoded.id, decoded.id);
    socketID = getSocketID();
    console.log('[Socket Middleware] AUTHORIZED | userID:', decoded.id);
    next();
  } catch (err) {
    console.log('[Socket Middleware] REJECTED - invalid token:', err.message);
    return next(new Error('Invalid token'));
  }
};

// Socket.IO setup
io.use(identifyUser);

io.on('connection', (socket) => {
  console.log('[Socket] Client connected:', socket.id, '| role:', socket.handshake.query.role || 'user');

  socket.on('disconnect', () => {
    console.log('[Socket] Client disconnected:', socket.id);
    if (socket.userID) {
      removeSocketIDEntry(socket.userID);
      socketID = getSocketID();
    }
  });

  if (socket.handshake.query.role === 'admin') {
    socket.join('admin');
    console.log('[Socket] Joined admin room. Admin room size:', io.sockets.adapter.rooms.get('admin')?.size);
    socket.emit('ping', { message: 'Socket connection confirmed' });
  } else {
    socket.join(socket.userID);
    console.log('[Socket] Joined user room:', socket.userID);
  }

  socket.on('order', (data) => {
    const adminRoom = io.sockets.adapter.rooms.get('admin');
    console.log('[Socket] "order" event from:', socket.id, '| data:', data);
    console.log('[Socket] Admin room exists:', !!adminRoom, '| size:', adminRoom?.size || 0);
    io.to('admin').emit('order', data);
    console.log('[Socket] Emitted "order" to admin room');
  });
});


app.patch("/api/v1/orders/deliver/:order", authController.protect, authController.restrictTo("admin", "owner", "driver"), orderController.deliverOrder, (req, res) => {
  const customerIdRaw = req.order.customerId;
  const userID = (customerIdRaw?._id || customerIdRaw || req.order.userID || "").toString();
  const userSocketID = socketID[userID];
  const status = req.order.status;

  console.log('[Deliver] Order updated | orderId:', req.order._id.toString(), '| status:', status);
  console.log('[Deliver] Resolved userID:', userID, '| userSocketID:', userSocketID);

  if (userSocketID) {
    if (status === 'delivered' || status === 'Delivered') {
      io.to(userSocketID).emit('orderUpdate', { 
        message: "Your order has been delivered", 
        orderId: req.order._id.toString(),
        status: 'delivered'
      });
    } else if (status === 'out_for_delivery' || status === 'assigned' || status === 'Ready for Delivery') {
      io.to(userSocketID).emit('orderUpdate', { 
        message: "Your order is out for delivery", 
        orderId: req.order._id.toString(),
        status: status
      });
    } else {
      io.to(userSocketID).emit('orderUpdate', { 
        message: `Your order status has been updated to: ${status}`, 
        orderId: req.order._id.toString(),
        status: status
      });
    }
  }

  // Send push notification to user regardless of socket connection
  let pushMessage = `Your order status has been updated to: ${status}`;
  if (status === 'delivered' || status === 'Delivered') pushMessage = "Your order has been delivered!";
  else if (status === 'out_for_delivery' || status === 'assigned') pushMessage = "Your order is out for delivery";
  else if (status === 'ready') pushMessage = "Your order is ready for pickup";
  else if (status === 'preparing') pushMessage = "Your order is being prepared";

  sendPushToUser(userID, "Order Update", pushMessage, { orderId: req.order._id.toString(), status });

  io.to('admin').emit('orderStatusUpdate', {
    orderId: req.order._id.toString(),
    status: status,
  });

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