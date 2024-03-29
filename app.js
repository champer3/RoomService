const express = require("express");
const morgan = require("morgan");
const session = require("express-session");
// const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const compression = require("compression");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const communicationRoutes = require("./routes/communicationRoutes");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config({ path: "./config.env" });
const User = require("./Models/userModel");
const authController = require("./controllers/authController");
const app = express();
// Set Security HTTP Headers
app.use(helmet());
// Limit request from same IP address
// const limiter = rateLimit({
//   max: 100,
//   windiwMs: 60 * 60 * 1000,
//   message: "Too many request from this IP, please try again in an hour",
// });
// app.use(limiter);
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(mongoSanitize());
app.use(xss());
// Prevent Parameter Pollution
app.use(hpp());
app.use(compression());
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.requestTime);
  next();
});
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/communications", communicationRoutes);
// Phone Number verification using TWILIO
// app.get("/getCode/:number", (req, res) => {
//   try {
//     const client = require("twilio")(
//       process.env.TWILIO_ACCOUNTSID,
//       process.env.TWILIO_AUTHTOKEN
//     );
//     client.verify.v2
//       .services(process.env.TWILIO_SERVICE)
//       .verifications.create({ to: req.params.number, channel: "sms" })
//       .then((verification) => console.log(verification.valid));
//     res.status(200).json({
//       status: "success",
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: "fail",
//       message: "just chill, I have no idea",
//       error: err,
//     });
//   }
// });
// app.get("/verifyPhone/:number/:code", async (req, res) => {
//   try {
//     const client = require("twilio")(
//       process.env.TWILIO_ACCOUNTSID,
//       process.env.TWILIO_AUTHTOKEN
//     );
//     const verificationCheck = await client.verify.v2
//       .services(process.env.TWILIO_SERVICE)
//       .verificationChecks.create({
//         to: req.params.number,
//         code: req.params.code,
//       });
//     if (verificationCheck.status === "approved") {
//       res.status(200).json({
//         status: "success",
//         verification: verificationCheck.status,
//       });
//       console.log("Verification successful!");
//     } else {
//       res.status(200).json({
//         status: "fail",
//         verification: verificationCheck.status,
//       });
//       console.log("Verification failed.");
//     }
//   } catch (err) {
//     res.status(400).json({
//       status: "fail",
//       message: "just chill, I have no idea",
//       error: err.message,
//     });
//   }
// });
function smsCallback(error, responseBody) {
  if (error === null) {
    console.log("\nResponse body:\n" + JSON.stringify(responseBody));
  } else {
    console.error("Unable to send SMS. Error:\n\n" + error);
  }
}
app.get("/getCode/", (req, res) => {
  try {
    const customerId = process.env.CUSTOMER_ID;
    const apiKey = process.env.TELESIGNAPIKEY;
    console.log(customerId)
    console.log(apiKey)
    // const TelesignSDK = require("telesignenterprisesdk");
    const TelesignSDK = require('./telesign_sdks/node_telesign_enterprise/src/telesign');
    console.log(TelesignSDK)
    // const phoneNumber = "6292441577";
    const phoneNumber = "+16156688834";
    const verifyCode = Math.floor(Math.random() * 999999).toString();
    const params = {
      verify_code: verifyCode,
    };
    const client = new TelesignSDK(customerId, apiKey);
    client.verify.sms(smsCallback, phoneNumber, params);
    res.status(200).json({
      status: "success",
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: "just chill, I have no idea",
      error: err,
    });
  }
});


app.get("/verifyPhone/", (req, res) => {
  // try {
  const sdk = require("api")("@telesign-enterprise/v1.0#jnsb20tlu2wb12v");
  sdk.auth(customerId, apiKey);
  sdk
    .getVerifyStatus({
      reference_id: "6639DEB2BE4C0A049194D7CEB5B14CE7",
      verify_code: "916193",
    })
    .then(({ data }) => {
      console.log(data);
      res.status(200).json({
        status: "success",
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(400).json({
        status: "fail",
        message: "just chill, I have no idea",
        error: err.message,
      });
    });
});
//..........................................................................................
module.exports = app;