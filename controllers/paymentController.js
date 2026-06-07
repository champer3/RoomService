const stripeLib = require("stripe");
const Order = require("./../Models/orderModel");
const userModel = require("./../Models/userModel");

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.trim() === "") {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to backend/.env (get it from Stripe Dashboard → Developers → API keys)."
    );
  }
  return stripeLib(key);
}

exports.getCheckOutSession = async (req, res, next) => {
  try {
    const stripe = getStripe();
    const user = req.user;
    let customer;
    if (user.customerID) {
      customer = user.customerID;
    } else {
      customer = await stripe.customers.create();
      customer = customer.id;
      const updatedUser = await userModel.findOneAndUpdate(
        { _id: user._id },
        {
          $set: {
            customerID: customer,
          },
        },
        { new: true }
      );
      console.log(updatedUser)
    }
    console.log("Customer ID:", customer)
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer },
      { apiVersion: "2023-10-16" }
    );
    console.log("Ephemeral Key:", ephemeralKey)
    const paymentIntent = await stripe.paymentIntents.create({
      // amount: req.body.amount * 100,
      amount: 100,
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
    console.error("checkout-session error:", err.message, err.type || "", err.code || "");
    if (err.raw) console.error("Stripe raw:", err.raw);
    res.status(400).json({
      status: "fail",
      message: err.message || "Failed to create checkout session",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

exports.getCardDetails = async (req, res, next) => {
  try {
    const stripe = getStripe();
    console.log("Getting card details");
    const user = req.user;
    let customer;
    if (user.customerID) {
      customer = user.customerID;
    } else {
      customer = await stripe.customers.create();
      customer = customer.id;
      const updatedUser = await userModel.findOneAndUpdate(
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
    console.log("Customer ID:", customer);

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer },
      { apiVersion: "2023-10-16" }
    );

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer,
      type: "card",
    });

    console.log(paymentMethods.data);

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
    console.error("payment-sheet (getCardDetails) error:", err.message, err.type || "", err.code || "");
    if (err.raw) console.error("Stripe raw:", err.raw);
    res.status(400).json({
      status: "fail",
      message: err.message || "Failed to create payment sheet",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

exports.getPaymentMethods = async (req, res, next) => {
  try {
    const stripe = getStripe();
    const customer = req.user.customerID;
    if (!customer) {
      return res.status(200).json({
        status: "success",
        note: "no card",
        message: "This user doesn't have any payment method set yet",
      });
    }
    const paymentMethods = await stripe.paymentMethods.list({
      customer,
      type: "card",
    });

    // Get default payment method
    const customerObj = await stripe.customers.retrieve(customer);
    const defaultPM = customerObj.invoice_settings?.default_payment_method || null;

    res.status(200).json({
      status: "success",
      paymentMethods: paymentMethods.data,
      defaultPaymentMethod: defaultPM,
    });
  } catch (err) {
    console.error("payment-methods error:", err.message);
    res.status(400).json({
      status: "fail",
      message: err.message || "Failed to get payment methods",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

exports.deletePaymentMethod = async (req, res, next) => {
  try {
    const stripe = getStripe();
    const { paymentMethodId } = req.params;
    if (!paymentMethodId) {
      return res.status(400).json({ status: "fail", message: "paymentMethodId is required" });
    }
    await stripe.paymentMethods.detach(paymentMethodId);
    res.status(200).json({ status: "success", message: "Payment method removed" });
  } catch (err) {
    console.error("delete-payment-method error:", err.message);
    res.status(400).json({
      status: "fail",
      message: err.message || "Failed to remove payment method",
    });
  }
};

exports.setDefaultPaymentMethod = async (req, res, next) => {
  try {
    const stripe = getStripe();
    const { paymentMethodId } = req.body;
    const customer = req.user.customerID;
    if (!customer || !paymentMethodId) {
      return res.status(400).json({ status: "fail", message: "customer and paymentMethodId required" });
    }
    await stripe.customers.update(customer, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    res.status(200).json({ status: "success", defaultPaymentMethod: paymentMethodId });
  } catch (err) {
    console.error("set-default-pm error:", err.message);
    res.status(400).json({
      status: "fail",
      message: err.message || "Failed to set default payment method",
    });
  }
};

exports.updatePaymentMethod = async (req, res, next) => {
  try {
    const stripe = getStripe();
    const { paymentMethodId } = req.params;
    const { name, exp_month, exp_year, address_line1, address_line2, address_city, address_state, address_postal_code, address_country } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({ status: "fail", message: "paymentMethodId is required" });
    }

    const updateData = {};

    if (name) {
      updateData.billing_details = { ...updateData.billing_details, name };
    }

    if (address_line1 || address_postal_code || address_city || address_state || address_country) {
      updateData.billing_details = {
        ...updateData.billing_details,
        address: {
          ...(address_line1 && { line1: address_line1 }),
          ...(address_line2 && { line2: address_line2 }),
          ...(address_city && { city: address_city }),
          ...(address_state && { state: address_state }),
          ...(address_postal_code && { postal_code: address_postal_code }),
          ...(address_country && { country: address_country }),
        },
      };
    }

    if (exp_month || exp_year) {
      updateData.card = {
        ...(exp_month && { exp_month: parseInt(exp_month) }),
        ...(exp_year && { exp_year: parseInt(exp_year) }),
      };
    }

    const updated = await stripe.paymentMethods.update(paymentMethodId, updateData);

    res.status(200).json({
      status: "success",
      paymentMethod: updated,
    });
  } catch (err) {
    console.error("update-payment-method error:", err.message);
    res.status(400).json({
      status: "fail",
      message: err.message || "Failed to update payment method",
    });
  }
};
