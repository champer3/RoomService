const mongoose = require("mongoose");

/**
 * Canonical order model aligned with backend/schema/postgres/orders.sql (logical fields).
 * Stored as one MongoDB document with embedded line items, variants, addons, address,
 * status history, and driver assignment history.
 *
 * Status flow:
 * - Delivery: placed → preparing → ready → assigned → picked_up → delivered
 * - Pickup:    placed → preparing → ready → picked_up (assigned/delivered optional)
 *
 * API / clients still using legacy fields (orderStatus, totalPrice, orderDetails, etc.)
 * must be updated to map to the names below.
 */

const ORDER_TYPE = ["delivery", "pickup"];
const ORDER_STATUS = [
  "placed",
  "preparing",
  "ready",
  "assigned",
  "picked_up",
  "delivered",
  "cancelled",
];
const PAYMENT_STATUS = ["pending", "paid", "failed", "refunded"];
const PAYMENT_METHOD = ["card", "cash", "wallet", "other"];

const orderItemVariantSchema = new mongoose.Schema(
  {
    optionGroupId: { type: String, default: null },
    optionChoiceId: { type: String, default: null },
    groupName: { type: String, required: true, trim: true, maxlength: 120 },
    choiceName: { type: String, required: true, trim: true, maxlength: 120 },
    priceAdjustment: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const orderItemAddonSchema = new mongoose.Schema(
  {
    addonId: { type: String, default: null },
    addonName: { type: String, required: true, trim: true, maxlength: 120 },
    unitPrice: { type: Number, required: true, default: 0, min: 0 },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    totalPrice: { type: Number, required: true, default: 0, min: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: { type: String, required: true, trim: true, maxlength: 150 },
    productDescription: { type: String, default: "" },
    productImageUrl: { type: String, default: "" },

    categoryName: { type: String, default: "", maxlength: 100 },
    departmentName: { type: String, default: "", maxlength: 100 },

    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },

    lineSubtotal: { type: Number, required: true, default: 0, min: 0 },
    lineTotal: { type: Number, required: true, default: 0, min: 0 },

    notes: { type: String, default: "" },

    variants: { type: [orderItemVariantSchema], default: [] },
    addons: { type: [orderItemAddonSchema], default: [] },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

orderItemSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const orderAddressSchema = new mongoose.Schema(
  {
    recipientName: { type: String, default: "", maxlength: 120 },
    phone: { type: String, default: "", maxlength: 30 },

    addressLine1: { type: String, default: "", maxlength: 200 },
    addressLine2: { type: String, default: "", maxlength: 200 },
    city: { type: String, default: "", maxlength: 100 },
    state: { type: String, default: "", maxlength: 100 },
    postalCode: { type: String, default: "", maxlength: 20 },
    country: { type: String, default: "", maxlength: 100 },

    /** Single-line display string (e.g. from geocoder or composed from parts) */
    formattedAddress: { type: String, default: "" },

    deliveryInstructions: { type: String, default: "" },

    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderStatusHistorySchema = new mongoose.Schema(
  {
    fromStatus: { type: String, default: null, maxlength: 30 },
    toStatus: { type: String, required: true, maxlength: 30 },
    changedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    changedByRole: { type: String, default: "", maxlength: 30 },
    note: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const orderDriverAssignmentSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedAt: { type: Date, default: Date.now },
    unassignedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 30,
      /** Filled in pre("validate") if omitted */
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    /** @deprecated Prefer customerId; kept for legacy documents */
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    orderType: {
      type: String,
      required: true,
      enum: ORDER_TYPE,
      default: "delivery",
    },

    status: {
      type: String,
      required: true,
      enum: ORDER_STATUS,
      default: "placed",
    },
    /** @deprecated Same as status; kept when old clients write orderStatus */
    orderStatus: { type: String, required: false },

    paymentStatus: {
      type: String,
      required: true,
      enum: PAYMENT_STATUS,
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: PAYMENT_METHOD,
      required: false,
    },

    subtotal: { type: Number, required: true, default: 0, min: 0 },
    taxAmount: { type: Number, required: true, default: 0, min: 0 },
    deliveryFee: { type: Number, required: true, default: 0, min: 0 },
    discountAmount: { type: Number, required: true, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, default: 0, min: 0 },
    /** @deprecated Legacy field; prefer totalAmount */
    totalPrice: { type: Number, required: false },

    notes: { type: String, default: "" },
    /** @deprecated Use notes */
    orderInstruction: { type: String, default: "" },

    placedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date, default: null },
    preparedAt: { type: Date, default: null },
    assignedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },

    items: {
      type: [orderItemSchema],
      default: [],
      validate: {
        validator(v) {
          if (!Array.isArray(v)) return false;
          if (v.length > 0) return true;
          const legacy = this.orderDetails;
          return Array.isArray(legacy) && legacy.length > 0;
        },
        message: "Order must have at least one line item (or legacy orderDetails)",
      },
    },

    /** @deprecated Prefer items; kept for legacy orders */
    orderDetails: { type: [mongoose.Schema.Types.Mixed], default: undefined },

    /** @deprecated Prefer deliveryAddress; kept for legacy orders */
    shippingAddress: { type: String, default: "" },

    /** Present for delivery orders; omit or leave unset for pickup */
    deliveryAddress: { type: orderAddressSchema, default: undefined },

    statusHistory: { type: [orderStatusHistorySchema], default: [] },
    driverAssignments: { type: [orderDriverAssignmentSchema], default: [] },

    /**
     * Kitchen prep checklist while status is preparing: fingerprint -> ready unit count.
     * Cleared when leaving preparing (except transition to ready retains map for undo flow);
     * cleared when leaving ready for a downstream status.
     */
    preparationProgress: { type: mongoose.Schema.Types.Mixed, default: undefined },

    /** Guest checkout when customerId is null */
    guestName: { type: String, default: "" },
    guestPhone: { type: String, default: "" },
    guestEmail: { type: String, default: "" },

    trackingToken: { type: String, default: "" },
    proofOfDelivery: { type: [String], default: [] },
    proofOfAge: { type: [String], default: [] },
    dob: { type: Date, default: null },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

orderSchema.index({ status: 1 });
orderSchema.index({ orderType: 1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ assignedDriverId: 1 });
orderSchema.index({ placedAt: -1 });

function mapLegacyStatusToCanonical(input) {
  if (input == null || input === "") return null;
  const key = String(input).trim();
  const lower = key.toLowerCase();
  if (ORDER_STATUS.includes(lower)) return lower;
  const legacy = {
    ordered: "placed",
    placed: "placed",
    preparing: "preparing",
    ready: "ready",
    "ready for delivery": "ready",
    "ready for pickup": "ready",
    "out for delivery": "assigned",
    assigned: "assigned",
    picked_up: "picked_up",
    "picked up": "picked_up",
    delivered: "delivered",
    completed: "delivered",
    cancelled: "cancelled",
  };
  return legacy[lower] || null;
}

orderSchema.pre("validate", function (next) {
  if (!this.orderNumber || !String(this.orderNumber).trim()) {
    this.orderNumber = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;
  }

  const legacySt = mapLegacyStatusToCanonical(this.orderStatus);
  if (legacySt && this.status === "placed" && this.orderStatus) {
    this.status = legacySt;
  }
  this.orderStatus = this.status;

  if (typeof this.orderType === "string") {
    const ot = this.orderType.toLowerCase();
    if (ot === "delivery" || ot === "pickup") this.orderType = ot;
  }

  if (typeof this.paymentStatus === "boolean") {
    this.paymentStatus = this.paymentStatus ? "paid" : "pending";
  }

  if (!String(this.notes || "").trim() && String(this.orderInstruction || "").trim()) {
    this.notes = String(this.orderInstruction);
  }

  if (
    (this.totalAmount == null || this.totalAmount === 0) &&
    this.totalPrice != null &&
    !Number.isNaN(Number(this.totalPrice))
  ) {
    this.totalAmount = Number(this.totalPrice);
  }

  const legacyShip = String(this.shippingAddress || "").trim();
  if (this.orderType === "delivery") {
    const a = this.deliveryAddress;
    const structuredOk =
      a &&
      typeof a === "object" &&
      String(a.addressLine1 || "").trim() &&
      String(a.city || "").trim();
    const formattedOk =
      a &&
      typeof a === "object" &&
      String(a.formattedAddress || "").trim().length >= 3;
    if (!structuredOk && !formattedOk && legacyShip.length >= 3) {
      this.deliveryAddress = {
        ...(a && typeof a === "object" ? a.toObject?.() ?? a : {}),
        formattedAddress: legacyShip,
        addressLine1: legacyShip,
        city: "—",
      };
    } else if (!structuredOk && !formattedOk) {
      this.invalidate(
        "deliveryAddress",
        "Delivery orders require deliveryAddress (formattedAddress, or address line 1 and city)"
      );
    }
  }

  if (
    this.orderType === "delivery" &&
    this.deliveryAddress &&
    typeof this.deliveryAddress === "object" &&
    !String(this.shippingAddress || "").trim()
  ) {
    const a = this.deliveryAddress;
    const fromSub =
      String(a.formattedAddress || "").trim() ||
      [a.addressLine1, a.city, a.state, a.postalCode]
        .filter((x) => x && String(x).trim())
        .join(", ");
    if (fromSub) this.shippingAddress = fromSub;
  }

  next();
});

orderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

/** Legacy / convenience aliases for API consumers (toJSON virtuals: true) */
orderSchema.virtual("date").get(function () {
  return this.placedAt;
});
orderSchema.virtual("userName").get(function () {
  return this.guestName || "";
});
orderSchema.virtual("driver").get(function () {
  const d = this.assignedDriverId;
  if (d && typeof d === "object" && d.email) return d.email;
  if (d) return String(d);
  return "";
});
const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
module.exports.ORDER_TYPE = ORDER_TYPE;
module.exports.ORDER_STATUS = ORDER_STATUS;
module.exports.PAYMENT_STATUS = PAYMENT_STATUS;
module.exports.PAYMENT_METHOD = PAYMENT_METHOD;
