const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("./../Models/orderModel");
const User = require("./../Models/userModel");

exports.getCheckOutSession = async (req, res, next) => {
  try {
    const user = req.user;
    // console.log("body", req.body)
    let customer;
    if (user.customerID) {
      customer = user.customerID;
    } else {
      customer = await stripe.customers.create();
      customer = customer.id;
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        {
          $set: {
            customerID: customer,
          },
        },
        { new: true }
      );
      // console.log(updatedUser)
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer },
      { apiVersion: "2023-10-16" }
    );
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount * 100,
      customer: customer,
      setup_future_usage: "off_session",
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });
    // if (paymentIntent) {
    //   const order = await Order.create({ ...req.body, userID: req.user.id });
    //   console.log(order)
    //   const user = await User.findById(order.userID);
    //   user.order.push(order._id);
    //   user.save();
    // }
    // console.log(paymentIntent);
    res.status(200).json({
      status: "success",
      clientSecret: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer,
      // order: order.id
    });
  } catch (err) {
    // console.log(err.message);
    res.status(400).json({
      status: "fail",
      message: "just chill, I have no idea",
      error: err,
    });
  }
};

exports.getCardDetails = async (req, res, next) => {
  try {
    const user = req.user;
    let customer;
    if (user.customerID) {
      customer = user.customerID;
    } else {
      customer = await stripe.customers.create();
      customer = customer.id;
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        {
          $set: {
            customerID: customer,
          },
        },
        { new: true }
      );
      // console.log(updatedUser)
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer },
      { apiVersion: "2023-10-16" }
    );

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer,
      type: "card",
    });

    // console.log(paymentMethods.data);

    const setupIntent = await stripe.setupIntents.create({
      customer: customer,
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter
      // is optional because Stripe enables its functionality by default.
      automatic_payment_methods: {
        enabled: true,
      },
    });
    // console.log(setupIntent)
    res.status(200).json({
      status: "success",
      setupIntent: setupIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer,
    });
  } catch (err) {
    // console.log(err.message);
    res.status(400).json({
      status: "fail",
      message: "just chill, I have no idea",
      error: err,
    });
  }
};

exports.getPaymentMethods = async (req, res, next) => {
  try {
    const customer = req.user.customerID;
    if (!customer) {
      return res.status(200).json({
        status: "success",
        note: "no card",
        message: "This user doesn't have any payment method set yet",
      });
    }
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer,
      type: "card",
    });

    res.status(200).json({
      status: "success",
      paymentMethods: paymentMethods.data,
    });

    // console.log(paymentMethods.data);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: "just chill, I have no idea",
      error: err,
    });
  }
};
