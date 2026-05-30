const mongoose = require("mongoose");
const User = require("../Models/userModel");

const NEW_STATUSES = new Set([
  "placed",
  "preparing",
  "ready",
  "assigned",
  "picked_up",
  "delivered",
  "cancelled",
]);

function normalizeStatus(input) {
  if (input == null || input === "") return null;
  const key = String(input).trim().toLowerCase();
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
  if (NEW_STATUSES.has(key)) return key;
  if (legacy[key] != null) return legacy[key];
  return null;
}

function normalizeOrderType(input) {
  if (input == null) return "delivery";
  const k = String(input).trim().toLowerCase();
  if (k === "pickup") return "pickup";
  return "delivery";
}

function normalizePaymentStatus(input) {
  if (input === true) return "paid";
  if (input === false) return "pending";
  if (input == null || input === "") return "pending";
  const k = String(input).trim().toLowerCase();
  if (["pending", "paid", "failed", "refunded"].includes(k)) return k;
  return "pending";
}

function normalizePaymentMethod(input) {
  if (input == null || input === "") return undefined;
  const k = String(input).trim().toLowerCase();
  if (["card", "cash", "wallet", "other"].includes(k)) return k;
  return undefined;
}

function stampStatusTimestamps(orderDoc, status) {
  const now = new Date();
  switch (status) {
    case "preparing":
      if (!orderDoc.acceptedAt) orderDoc.acceptedAt = now;
      break;
    case "ready":
      orderDoc.preparedAt = now;
      break;
    case "assigned":
      orderDoc.assignedAt = now;
      break;
    case "picked_up":
      orderDoc.pickedUpAt = now;
      break;
    case "delivered":
      orderDoc.deliveredAt = now;
      break;
    case "cancelled":
      orderDoc.cancelledAt = now;
      break;
    default:
      break;
  }
}

/**
 * Build payload for Order.create from request body (supports legacy + new keys).
 */
function buildCreatePayload(body, { customerId, guestName }) {
  const orderType = normalizeOrderType(body.orderType);
  const totalAmount = Number(body.totalAmount ?? body.totalPrice ?? 0);
  const subtotal = Number(body.subtotal ?? totalAmount);
  const taxAmount = Number(body.taxAmount ?? 0);
  const deliveryFee = Number(body.deliveryFee ?? 0);
  const discountAmount = Number(body.discountAmount ?? 0);

  let items = body.items;
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error("Order must include a non-empty items array");
  }

  items = items.map((line) => {
    let pid;
    try {
      pid = new mongoose.Types.ObjectId(String(line.productId));
    } catch {
      throw new Error(`Invalid productId: ${line.productId}`);
    }
    return {
    productId: pid,
    productName: String(line.productName || ""),
    productDescription: line.productDescription || "",
    productImageUrl: line.productImageUrl || "",
    categoryName: line.categoryName || "",
    departmentName: line.departmentName || "",
    unitPrice: Number(line.unitPrice || 0),
    quantity: Math.max(1, Number(line.quantity || 1)),
    lineSubtotal: Number(line.lineSubtotal ?? line.unitPrice * (line.quantity || 1)),
    lineTotal: Number(line.lineTotal ?? line.lineSubtotal ?? line.unitPrice * (line.quantity || 1)),
    notes: line.notes || "",
    variants: Array.isArray(line.variants) ? line.variants : [],
    addons: Array.isArray(line.addons) ? line.addons : [],
  };
  });

  let deliveryAddress = body.deliveryAddress;
  if (orderType === "delivery" && !deliveryAddress && body.shippingAddress) {
    const s = String(body.shippingAddress).trim();
    deliveryAddress = {
      formattedAddress: s,
      addressLine1: s,
      city: body.city || "—",
      state: body.state || "",
      postalCode: body.postalCode || "",
      country: body.country || "",
    };
  }

  const payload = {
    customerId: customerId || null,
    guestName: guestName || body.guestName || "",
    guestPhone: body.guestPhone || "",
    guestEmail: body.guestEmail || "",
    orderType,
    status: normalizeStatus(body.status ?? body.orderStatus) || "placed",
    paymentStatus: normalizePaymentStatus(body.paymentStatus),
    paymentMethod: normalizePaymentMethod(body.paymentMethod),
    subtotal,
    taxAmount,
    deliveryFee,
    discountAmount,
    totalAmount,
    notes: body.notes != null ? String(body.notes) : body.orderInstruction != null ? String(body.orderInstruction) : "",
    placedAt: body.placedAt ? new Date(body.placedAt) : body.date ? new Date(body.date) : new Date(),
    items,
    trackingToken: body.trackingToken || "",
  };

  if (orderType === "delivery" && deliveryAddress) {
    payload.deliveryAddress = deliveryAddress;
  }

  if (body.orderNumber) payload.orderNumber = String(body.orderNumber).trim();

  return payload;
}

const PREP_FINGERPRINT_KEY_MAX = 512;
const PREP_READY_MAX = 9999;

function mergePreparationProgressInto(orderDoc, bodyProgress) {
  if (bodyProgress === null) {
    orderDoc.preparationProgress = undefined;
    return;
  }
  if (typeof bodyProgress !== "object" || Array.isArray(bodyProgress)) {
    return;
  }
  let prev = {};
  const cur = orderDoc.preparationProgress;
  if (cur && typeof cur === "object" && !Array.isArray(cur)) {
    prev =
      typeof cur.toObject === "function"
        ? cur.toObject()
        : { ...cur };
  }
  for (const [k, v] of Object.entries(bodyProgress)) {
    if (typeof k !== "string" || k.length === 0 || k.length > PREP_FINGERPRINT_KEY_MAX) {
      continue;
    }
    if (v == null) {
      delete prev[k];
      continue;
    }
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    const clamped = Math.max(0, Math.min(PREP_READY_MAX, Math.floor(n)));
    if (clamped <= 0) {
      delete prev[k];
      continue;
    }
    prev[k] = clamped;
  }
  orderDoc.preparationProgress = prev;
}

/**
 * Apply PATCH-style updates to a loaded order document (mutates in place).
 */
async function applyOrderPatch(orderDoc, body, actingUser) {
  const userId = actingUser?._id || actingUser?.id;
  const role = actingUser?.role || "";

  const nextStatusRaw = body.status != null ? body.status : body.orderStatus;
  let nextStatus =
    nextStatusRaw != null ? normalizeStatus(nextStatusRaw) : null;

  let driverLinked = false;
  if (body.driver !== undefined) {
    const trimmed =
      body.driver == null ? "" : String(body.driver).trim();
    if (!trimmed) {
      (orderDoc.driverAssignments || []).forEach((a) => {
        if (a.isActive) {
          a.isActive = false;
          a.unassignedAt = new Date();
        }
      });
      orderDoc.assignedDriverId = null;
      if (orderDoc.status === "assigned" && nextStatus == null) {
        nextStatus = "ready";
      }
    } else {
      const email = trimmed.toLowerCase();
      const driverUser = await User.findOne({ email });
      if (driverUser) {
        (orderDoc.driverAssignments || []).forEach((a) => {
          if (a.isActive) {
            a.isActive = false;
            a.unassignedAt = new Date();
          }
        });
        orderDoc.driverAssignments.push({
          driverId: driverUser._id,
          assignedByUserId: userId || null,
          assignedAt: new Date(),
          unassignedAt: null,
          isActive: true,
        });
        orderDoc.assignedDriverId = driverUser._id;
        driverLinked = true;
      }
    }
  }

  if (driverLinked && !nextStatus) {
    nextStatus = "assigned";
  }

  if (body.preparationProgress !== undefined && orderDoc.status === "preparing") {
    mergePreparationProgressInto(orderDoc, body.preparationProgress);
  }

  if (nextStatus) {
    const from = orderDoc.status;
    if (from !== nextStatus) {
      orderDoc.status = nextStatus;
      orderDoc.statusHistory.push({
        fromStatus: from,
        toStatus: nextStatus,
        changedByUserId: userId || null,
        changedByRole: role,
        note: body.note || "",
        createdAt: new Date(),
      });
      stampStatusTimestamps(orderDoc, nextStatus);

      if (from === "preparing" && nextStatus !== "preparing" && nextStatus !== "ready") {
        orderDoc.preparationProgress = undefined;
      }
      if (
        from === "ready" &&
        nextStatus !== "ready" &&
        nextStatus !== "preparing"
      ) {
        orderDoc.preparationProgress = undefined;
      }
    }
  }

  if (body.notes !== undefined) {
    orderDoc.notes = String(body.notes);
  } else if (body.orderInstruction !== undefined) {
    orderDoc.notes = String(body.orderInstruction);
  }

  const scalarMap = [
    ["paymentStatus", (v) => normalizePaymentStatus(v)],
    ["paymentMethod", (v) => normalizePaymentMethod(v)],
    ["guestName", (v) => String(v)],
    ["guestPhone", (v) => String(v)],
    ["guestEmail", (v) => String(v)],
  ];

  for (const [key, norm] of scalarMap) {
    if (body[key] !== undefined) {
      const n = norm(body[key]);
      if (n !== undefined) orderDoc[key] = n;
    }
  }

  if (body.orderType != null) {
    orderDoc.orderType = normalizeOrderType(body.orderType);
  }

  if (body.totalAmount != null || body.totalPrice != null) {
    orderDoc.totalAmount = Number(body.totalAmount ?? body.totalPrice);
  }
  if (body.subtotal != null) orderDoc.subtotal = Number(body.subtotal);
  if (body.taxAmount != null) orderDoc.taxAmount = Number(body.taxAmount);
  if (body.deliveryFee != null) orderDoc.deliveryFee = Number(body.deliveryFee);
  if (body.discountAmount != null) orderDoc.discountAmount = Number(body.discountAmount);

  if (body.deliveryAddress != null) {
    const prev =
      orderDoc.deliveryAddress &&
      typeof orderDoc.deliveryAddress.toObject === "function"
        ? orderDoc.deliveryAddress.toObject()
        : orderDoc.deliveryAddress || {};
    orderDoc.deliveryAddress = { ...prev, ...body.deliveryAddress };
  }
  if (body.shippingAddress != null && orderDoc.orderType === "delivery") {
    const s = String(body.shippingAddress).trim();
    const prev =
      orderDoc.deliveryAddress &&
      typeof orderDoc.deliveryAddress.toObject === "function"
        ? orderDoc.deliveryAddress.toObject()
        : orderDoc.deliveryAddress || {};
    orderDoc.deliveryAddress = {
      ...prev,
      formattedAddress: s,
      addressLine1: s,
      city: prev.city || "—",
    };
  }

  return orderDoc;
}

module.exports = {
  normalizeStatus,
  normalizeOrderType,
  normalizePaymentStatus,
  buildCreatePayload,
  applyOrderPatch,
  NEW_STATUSES,
};
