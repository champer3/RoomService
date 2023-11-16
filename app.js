const express = require("express");
const morgan = require("morgan");
const passport = require("passport");
require("./passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const axios = require("axios");
const jwt = require("jsonwebtoken");

const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const communicationRoutes = require("./routes/communicationRoutes");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const User = require("./Models/userModel");
const authController = require("./controllers/authController");

const app = express();

// Set Security HTTP Headers
app.use(helmet());

// Limit request from same IP address
const limiter = rateLimit({
  max: 100,
  windiwMs: 60 * 60 * 1000,
  message: "Too many request from this IP, please try again in an hour",
});

app.use(limiter);

app.use(morgan("dev"));

app.use(express.json());

app.use(mongoSanitize());

app.use(xss());

// Prevent Parameter Pollution
app.use(hpp());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.requestTime);
  next();
});

//...............................................................................................................

app.use(
  session({ secret: process.env.MY_APP_SECRET, resave: true, saveUninitialized: true })
);
app.use(passport.initialize());
app.use(passport.session());

// // Google authentication route
app.get(
  "/auth/google",
  passport.authenticate(
    "google",
    { scope: ["profile", "email"], prompt: "consent" }
    // {
    // scope: ["https://www.googleapis.com/auth/plus.login"],
    // scope: ["email", "profile"],
    // }
  )
);

// // Google callback route
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res) => {
    console.log(req.authInfo);
    console.log(req.user);
    let user = await User.findOne({ googleID: req.user.id });
    if (user === null) {
      user = await User.create({
        firstName: req.user.name.givenName,
        lastName: req.user.name.familyName,
        email: req.user.emails[0].value,
        googleID: req.user.id,
      });
    }

    token = authController.createSendToken(user, 201, res);
  }
);

// FaceBook Authentication ...................................................

app.get("/", (req, res) => {
  res.send("Home Page");
});

app.get(
  "/auth/facebook",
  passport.authenticate("facebook", {
    scope: ["profile", "email"],
    prompt: "consent",
  })
);

app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/" }),
  async (req, res) => {
    console.log(req.user);
    let user = await User.findOne({ facebookID: req.user.id });
    const name = req.user.displayName.split(" ");
    if (user === null) {
      user = await User.create({
        firstName: name[0],
        lastName: name[1],
        facebookID: req.user.id,
      });
    }

    token = authController.createSendToken(user, 201, res);
  }
);

app.get("/profile", (req, res) => {
  if (req.isAuthenticated()) {
    // console.log(req.user)
    res.send(
      `<h1>Welcome ${req.user.displayName}</h1><img src="${req.user.photos[0].value}">`
    );
  } else {
    res.redirect("/");
  }
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// .......................................................................................

// Trying twillo out

app.get("/getCode", (req, res) => {
  const client = require("twilio")(
    process.env.TWILIO_ACCOUNTSID,
    process.env.TWILIO_AUTHTOKEN
  );
  client.verify.v2
    .services(process.env.TWILIO_SERVICE)
    .verifications.create({ to: process.env.MY_NUMBER, channel: "sms" })
    .then((verification) => console.log(verification));
});

app.get("verifyPhone", (req, res) => {
  client.verify.v2
    .services(process.env.TWILIO_SERVICE)
    .verificationChecks.create({ to: process.env.MY_NUMBER, code: 677993 })
    .then((verificationCheck) => {
      if (verificationCheck.status === "approved") {
        console.log("Verification successful!");
      } else {
        console.log("Verification failed.");
      }
    });
});

//..........................................................................................

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/communications", communicationRoutes);

module.exports = app;
