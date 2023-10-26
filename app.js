const express = require("express");
const morgan = require("morgan");
// const User = require("./Models/userModel");
const userRoutes = require("./routes/userRoutes")
const productRoutes = require("./routes/productRoutes")

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

// app.get("/api/v1/users", (req, res) => {
//   res.send("Hello, Worlddddddddddddd!");
// });

// app.post("/user", async (req, res) => {
//   try {
//     const newUser = await User.create(req.body);

//     res.status(201).json({
//       status: "success",
//       data: {
//         user: newUser,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: "fail",
//       message: err,
//     });
//   }
// });

module.exports = app;
