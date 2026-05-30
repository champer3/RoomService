const Promotion = require('../Models/promotionModel');
const {
  buildPromotionCreatePayload,
  buildPromotionUpdatePatch,
} = require('../utils/promotionPayload');

function buildListQuery(req) {
  const query = {};

  if (req.query.activeNow === 'true') {
    const now = new Date();
    query.status = 'active';
    query.$and = [
      { $or: [{ startAt: null }, { startAt: { $exists: false } }, { startAt: { $lte: now } }] },
      { $or: [{ endAt: null }, { endAt: { $exists: false } }, { endAt: { $gte: now } }] },
    ];
  } else {
    if (req.query.type) query.type = String(req.query.type).trim();
    if (req.query.status) query.status = String(req.query.status).trim();
  }

  if (req.query.surface || req.query.slot) {
    const em = {};
    if (req.query.surface) em.surface = String(req.query.surface).trim();
    if (req.query.slot) em.slot = String(req.query.slot).trim();
    query.placements = { $elemMatch: em };
  }

  return query;
}

exports.getAllPromotions = async (req, res) => {
  try {
    const query = buildListQuery(req);
    const promotions = await Promotion.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    res.status(200).json({
      status: 'success',
      results: promotions.length,
      data: { promotions },
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: err.message || String(err),
    });
  }
};

exports.getPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id).lean();
    if (!promotion) {
      return res.status(404).json({
        status: 'fail',
        message: 'Promotion not found',
      });
    }
    res.status(200).json({
      status: 'success',
      data: { promotion },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message || String(err),
    });
  }
};

exports.createPromotion = async (req, res) => {
  try {
    const payload = buildPromotionCreatePayload(req.body, req.user && req.user._id);
    const doc = await Promotion.create(payload);
    res.status(201).json({
      status: 'success',
      data: { promotion: doc.toObject() },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'Coupon code already exists',
      });
    }
    res.status(400).json({
      status: 'fail',
      message: err.message || String(err),
    });
  }
};

/**
 * PATCH replaces `targets`, `placements`, `audiences`, `dealConditions`, and `dealRewards` when those keys are sent.
 * Type-specific config objects are shallow-merged with existing values when sent.
 */
exports.updatePromotion = async (req, res) => {
  try {
    const existing = await Promotion.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        status: 'fail',
        message: 'Promotion not found',
      });
    }
    const patch = buildPromotionUpdatePatch(req.body, existing);
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'No valid fields to update',
      });
    }
    Object.assign(existing, patch);
    await existing.save();
    res.status(200).json({
      status: 'success',
      data: { promotion: existing.toObject() },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'Coupon code already exists',
      });
    }
    res.status(400).json({
      status: 'fail',
      message: err.message || String(err),
    });
  }
};

/** Soft delete: set status to inactive. */
exports.deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true, runValidators: true }
    ).lean();
    if (!promotion) {
      return res.status(404).json({
        status: 'fail',
        message: 'Promotion not found',
      });
    }
    res.status(200).json({
      status: 'success',
      data: { promotion },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message || String(err),
    });
  }
};
