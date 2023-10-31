const express = require("express");
const morgan = require("morgan");
const userRoutes = require("./routes/userRoutes")
const productRoutes = require("./routes/productRoutes")
const reviewRoutes = require("./routes/reviewRoutes")
const orderRoutes = require("./routes/orderRoutes")
const cartRoutes = require("./routes/cartRoutes")
const communicationRoutes = require("./routes/communicationRoutes")

const app = express();

app.use(morgan("dev"));

app.use(express.json());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.requestTime);
  next();
});

app.use('/api/v1/users', userRoutes)
app.use('/api/v1/products', productRoutes)
app.use('/api/v1/reviews', reviewRoutes)
app.use('/api/v1/orders', orderRoutes)
app.use('/api/v1/cart', cartRoutes)
app.use('/api/v1/communications', communicationRoutes)

module.exports = app;
