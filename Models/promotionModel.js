const mongoose = require('mongoose');

const PROMOTION_TYPES = ['special', 'sale', 'deal', 'banner', 'coupon'];
const PROMOTION_STATUSES = ['draft', 'active', 'inactive', 'scheduled', 'expired'];

const TARGET_TYPES = ['department', 'category', 'product', 'order', 'all'];
const PLACEMENT_SURFACES = ['home', 'department', 'category', 'product', 'cart', 'checkout'];
const PLACEMENT_SLOTS = [
  'hero',
  'featured_strip',
  'inline_banner',
  'top_banner',
  'section_card',
  'popup',
  'badge_area',
  'summary_block',
  'coupon_entry',
  'summary_line',
];
const PLACEMENT_CONTEXT_TYPES = ['none', 'department', 'category', 'product'];

const CTA_TYPES = ['product', 'category', 'department', 'custom_link', 'none'];
const HIGHLIGHT_STYLES = ['standard', 'hero', 'featured', 'compact'];
const DISCOUNT_TYPES = ['percentage', 'fixed_amount'];
const COUPON_DISCOUNT_TYPES = ['percentage', 'fixed_amount', 'free_delivery'];
const BANNER_ALIGN = ['left', 'center', 'right'];

const DEAL_TYPES = [
  'bogo',
  'bundle_price',
  'free_addon',
  'percentage_off',
  'fixed_amount_off',
];

const CONDITION_TYPES = [
  'buy_quantity',
  'buy_product',
  'buy_category',
  'order_minimum',
  'product_quantity',
  'category_quantity',
  'department_subtotal',
  'order_type',
];

const REWARD_TYPES = [
  'free_product',
  'free_addon',
  'discount',
  'bundle_price',
  'percentage_discount',
  'fixed_discount',
  'free_delivery',
];

const promotionTargetSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: TARGET_TYPES,
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const promotionPlacementSchema = new mongoose.Schema(
  {
    surface: {
      type: String,
      enum: PLACEMENT_SURFACES,
      required: true,
    },
    slot: {
      type: String,
      enum: PLACEMENT_SLOTS,
      required: true,
    },
    contextType: {
      type: String,
      enum: PLACEMENT_CONTEXT_TYPES,
      default: 'none',
    },
    contextId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const promotionAudienceSchema = new mongoose.Schema(
  {
    audienceType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    audienceRule: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const specialPromotionConfigSchema = new mongoose.Schema(
  {
    badgeLabel: { type: String, trim: true, maxlength: 100 },
    ctaLabel: { type: String, trim: true, maxlength: 100 },
    ctaType: { type: String, enum: CTA_TYPES },
    ctaTarget: { type: String, trim: true },
    highlightStyle: {
      type: String,
      enum: HIGHLIGHT_STYLES,
      default: 'standard',
    },
  },
  { _id: false }
);

const salePromotionConfigSchema = new mongoose.Schema(
  {
    discountType: {
      type: String,
      enum: DISCOUNT_TYPES,
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    showSaleBadge: { type: Boolean, default: true },
    badgeLabel: { type: String, trim: true, maxlength: 100, default: 'Sale' },
  },
  { _id: false }
);

const bannerPromotionConfigSchema = new mongoose.Schema(
  {
    headline: { type: String, trim: true, maxlength: 200 },
    subheadline: { type: String, trim: true },
    buttonLabel: { type: String, trim: true, maxlength: 100 },
    buttonType: { type: String, enum: CTA_TYPES },
    buttonTarget: { type: String, trim: true },
    theme: { type: String, trim: true, maxlength: 30, default: 'default' },
    textAlignment: {
      type: String,
      enum: BANNER_ALIGN,
      default: 'left',
    },
  },
  { _id: false }
);

const couponPromotionConfigSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 50,
    },
    discountType: {
      type: String,
      enum: COUPON_DISCOUNT_TYPES,
      required: true,
    },
    discountValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    usageLimit: { type: Number, min: 1, default: null },
    perCustomerLimit: { type: Number, min: 1, default: null },
    firstOrderOnly: { type: Boolean, default: false },
  },
  { _id: false }
);

const dealPromotionConfigSchema = new mongoose.Schema(
  {
    dealType: {
      type: String,
      enum: DEAL_TYPES,
      required: true,
    },
    promoLabel: { type: String, trim: true, maxlength: 100 },
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    usageLimit: { type: Number, min: 1, default: null },
    perCustomerLimit: { type: Number, min: 1, default: null },
  },
  { _id: false }
);

const dealConditionSchema = new mongoose.Schema(
  {
    conditionType: {
      type: String,
      enum: CONDITION_TYPES,
      required: true,
    },
    conditionValue: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const dealRewardSchema = new mongoose.Schema(
  {
    rewardType: {
      type: String,
      enum: REWARD_TYPES,
      required: true,
    },
    rewardValue: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const promotionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: PROMOTION_TYPES,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    subtitle: { type: String, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: PROMOTION_STATUSES,
      default: 'draft',
    },
    imageUrl: { type: String, trim: true },
    mobileImageUrl: { type: String, trim: true },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    displayOrder: { type: Number, default: 0 },
    isStackable: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    targets: { type: [promotionTargetSchema], default: [] },
    placements: { type: [promotionPlacementSchema], default: [] },
    audiences: { type: [promotionAudienceSchema], default: [] },
    specialConfig: { type: specialPromotionConfigSchema, default: undefined },
    saleConfig: { type: salePromotionConfigSchema, default: undefined },
    bannerConfig: { type: bannerPromotionConfigSchema, default: undefined },
    couponConfig: { type: couponPromotionConfigSchema, default: undefined },
    dealConfig: { type: dealPromotionConfigSchema, default: undefined },
    dealConditions: { type: [dealConditionSchema], default: [] },
    dealRewards: { type: [dealRewardSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

function placementKey(p) {
  const id = p.contextId ? String(p.contextId) : '';
  return `${p.surface}|${p.slot}|${p.contextType}|${id}`;
}

promotionSchema.pre('validate', function (next) {
  const doc = this;
  const seen = new Set();
  for (let i = 0; i < (doc.placements || []).length; i++) {
    const p = doc.placements[i];
    const k = placementKey(p);
    if (seen.has(k)) {
      return next(new Error(`Duplicate placement: ${k}`));
    }
    seen.add(k);
  }

  for (let i = 0; i < (doc.targets || []).length; i++) {
    const t = doc.targets[i];
    if (t.targetType === 'all' && t.targetId != null) {
      return next(new Error('targetId must be null when targetType is "all"'));
    }
    if (t.targetType !== 'all' && t.targetId == null) {
      return next(new Error(`targetId is required when targetType is "${t.targetType}"`));
    }
  }

  const type = doc.type;

  function clearConfigs(keep) {
    if (keep !== 'special') doc.specialConfig = undefined;
    if (keep !== 'sale') doc.saleConfig = undefined;
    if (keep !== 'banner') doc.bannerConfig = undefined;
    if (keep !== 'coupon') doc.couponConfig = undefined;
    if (keep !== 'deal') {
      doc.dealConfig = undefined;
      doc.dealConditions = [];
      doc.dealRewards = [];
    }
  }

  if (type === 'special') {
    clearConfigs('special');
    const sc = doc.specialConfig && (doc.specialConfig.toObject ? doc.specialConfig.toObject() : doc.specialConfig);
    if (!sc || !Object.keys(sc).length) {
      doc.specialConfig = { highlightStyle: 'standard' };
    }
  } else if (type === 'sale') {
    clearConfigs('sale');
    if (!doc.saleConfig || doc.saleConfig.discountType == null || doc.saleConfig.discountValue == null) {
      return next(new Error('saleConfig with discountType and discountValue is required for type "sale"'));
    }
  } else if (type === 'banner') {
    clearConfigs('banner');
    const bc = doc.bannerConfig && (doc.bannerConfig.toObject ? doc.bannerConfig.toObject() : doc.bannerConfig);
    if (!bc || !Object.keys(bc).length) {
      doc.bannerConfig = { theme: 'default', textAlignment: 'left' };
    }
  } else if (type === 'coupon') {
    clearConfigs('coupon');
    if (!doc.couponConfig || !doc.couponConfig.code || !doc.couponConfig.discountType) {
      return next(new Error('couponConfig with code and discountType is required for type "coupon"'));
    }
  } else if (type === 'deal') {
    clearConfigs('deal');
    if (!doc.dealConfig || !doc.dealConfig.dealType) {
      return next(new Error('dealConfig with dealType is required for type "deal"'));
    }
  }

  next();
});

promotionSchema.index({ status: 1, type: 1, startAt: 1, endAt: 1 });
promotionSchema.index({ 'couponConfig.code': 1 }, { unique: true, sparse: true });

const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion;
module.exports.PROMOTION_TYPES = PROMOTION_TYPES;
module.exports.PROMOTION_STATUSES = PROMOTION_STATUSES;
module.exports.TARGET_TYPES = TARGET_TYPES;
module.exports.PLACEMENT_SURFACES = PLACEMENT_SURFACES;
module.exports.PLACEMENT_SLOTS = PLACEMENT_SLOTS;
module.exports.PLACEMENT_CONTEXT_TYPES = PLACEMENT_CONTEXT_TYPES;
