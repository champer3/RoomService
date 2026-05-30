const mongoose = require('mongoose');
const {
  PROMOTION_TYPES,
  PROMOTION_STATUSES,
  TARGET_TYPES,
  PLACEMENT_SURFACES,
  PLACEMENT_SLOTS,
  PLACEMENT_CONTEXT_TYPES,
} = require('../Models/promotionModel');

function num(v, fallback = null) {
  if (v === '' || v === undefined) return fallback;
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function oid(v) {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v);
  if (!mongoose.isValidObjectId(s)) {
    throw new Error(`Invalid ObjectId: ${s}`);
  }
  return new mongoose.Types.ObjectId(s);
}

function plainSubdoc(x) {
  if (x == null) return {};
  return x.toObject ? x.toObject() : { ...x };
}

function pickDefined(obj, keys) {
  const out = {};
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined) {
      out[k] = obj[k];
    }
  }
  return out;
}

function normalizeTargets(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((t) => {
    const targetType = String(t.targetType || t.target_type || '').trim();
    if (!TARGET_TYPES.includes(targetType)) {
      throw new Error(`Invalid targetType: ${targetType}`);
    }
    let targetId = null;
    if (targetType !== 'all') {
      targetId = oid(t.targetId ?? t.target_id);
    }
    return { targetType, targetId };
  });
}

function normalizePlacements(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = raw.map((p) => {
    const surface = String(p.surface || '').trim();
    const slot = String(p.slot || '').trim();
    const contextType = String(p.contextType || p.context_type || 'none').trim() || 'none';
    if (!PLACEMENT_SURFACES.includes(surface)) {
      throw new Error(`Invalid placement surface: ${surface}`);
    }
    if (!PLACEMENT_SLOTS.includes(slot)) {
      throw new Error(`Invalid placement slot: ${slot}`);
    }
    if (!PLACEMENT_CONTEXT_TYPES.includes(contextType)) {
      throw new Error(`Invalid placement contextType: ${contextType}`);
    }
    let contextId = null;
    if (contextType !== 'none') {
      contextId = oid(p.contextId ?? p.context_id);
    }
    const displayOrder = num(p.displayOrder ?? p.display_order, 0) ?? 0;
    const key = `${surface}|${slot}|${contextType}|${contextId ? String(contextId) : ''}`;
    if (seen.has(key)) {
      throw new Error(`Duplicate placement: ${key}`);
    }
    seen.add(key);
    return { surface, slot, contextType, contextId, displayOrder };
  });
  return out;
}

function normalizeAudiences(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((a) => ({
    audienceType: String(a.audienceType || a.audience_type || '').trim(),
    audienceRule: a.audienceRule != null ? a.audienceRule : a.audience_rule,
  }));
}

function normalizeDealConditions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => ({
    conditionType: String(c.conditionType || c.condition_type || '').trim(),
    conditionValue: c.conditionValue != null ? c.conditionValue : c.condition_value,
  }));
}

function normalizeDealRewards(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => ({
    rewardType: String(r.rewardType || r.reward_type || '').trim(),
    rewardValue: r.rewardValue != null ? r.rewardValue : r.reward_value,
  }));
}

function normalizeSpecialConfig(src) {
  if (!src || typeof src !== 'object') return undefined;
  return pickDefined(
    {
      badgeLabel: src.badgeLabel != null ? String(src.badgeLabel).trim() : undefined,
      ctaLabel: src.ctaLabel != null ? String(src.ctaLabel).trim() : undefined,
      ctaType: src.ctaType,
      ctaTarget: src.ctaTarget != null ? String(src.ctaTarget).trim() : undefined,
      highlightStyle: src.highlightStyle,
    },
    ['badgeLabel', 'ctaLabel', 'ctaType', 'ctaTarget', 'highlightStyle']
  );
}

function normalizeSaleConfig(src) {
  if (!src || typeof src !== 'object') return undefined;
  const discountType = src.discountType || src.discount_type;
  const discountValue = num(src.discountValue ?? src.discount_value, undefined);
  if (discountType === undefined || discountValue === undefined) {
    return undefined;
  }
  return {
    discountType,
    discountValue,
    showSaleBadge: src.showSaleBadge !== false && src.show_sale_badge !== false,
    badgeLabel:
      src.badgeLabel != null
        ? String(src.badgeLabel).trim()
        : src.badge_label != null
          ? String(src.badge_label).trim()
          : 'Sale',
  };
}

function normalizeBannerConfig(src) {
  if (!src || typeof src !== 'object') return undefined;
  return pickDefined(
    {
      headline: src.headline != null ? String(src.headline).trim() : undefined,
      subheadline: src.subheadline != null ? String(src.subheadline).trim() : undefined,
      buttonLabel: src.buttonLabel != null ? String(src.buttonLabel).trim() : undefined,
      buttonType: src.buttonType,
      buttonTarget: src.buttonTarget != null ? String(src.buttonTarget).trim() : undefined,
      theme: src.theme,
      textAlignment: src.textAlignment,
    },
    [
      'headline',
      'subheadline',
      'buttonLabel',
      'buttonType',
      'buttonTarget',
      'theme',
      'textAlignment',
    ]
  );
}

function normalizeCouponConfig(src) {
  if (!src || typeof src !== 'object') return undefined;
  const code = src.code != null ? String(src.code).trim().toUpperCase() : '';
  const discountType = src.discountType || src.discount_type;
  const discountValue = num(src.discountValue ?? src.discount_value, 0) ?? 0;
  const minimumOrderAmount = num(src.minimumOrderAmount ?? src.minimum_order_amount, 0) ?? 0;
  const usageLimit = num(src.usageLimit ?? src.usage_limit, null);
  const perCustomerLimit = num(src.perCustomerLimit ?? src.per_customer_limit, null);
  if (!code || !discountType) {
    return undefined;
  }
  return {
    code,
    discountType,
    discountValue,
    minimumOrderAmount,
    usageLimit: usageLimit === null ? null : usageLimit,
    perCustomerLimit: perCustomerLimit === null ? null : perCustomerLimit,
    firstOrderOnly: !!(src.firstOrderOnly ?? src.first_order_only),
  };
}

function normalizeDealConfig(src) {
  if (!src || typeof src !== 'object') return undefined;
  const dealType = src.dealType || src.deal_type;
  if (!dealType) return undefined;
  const minimumOrderAmount = num(src.minimumOrderAmount ?? src.minimum_order_amount, 0) ?? 0;
  const usageLimit = num(src.usageLimit ?? src.usage_limit, null);
  const perCustomerLimit = num(src.perCustomerLimit ?? src.per_customer_limit, null);
  return {
    dealType,
    promoLabel:
      src.promoLabel != null
        ? String(src.promoLabel).trim()
        : src.promo_label != null
          ? String(src.promo_label).trim()
          : undefined,
    minimumOrderAmount,
    usageLimit: usageLimit === null ? null : usageLimit,
    perCustomerLimit: perCustomerLimit === null ? null : perCustomerLimit,
  };
}

function typedConfigsForType(type, body) {
  const specialConfig =
    body.specialConfig || body.special_config
      ? normalizeSpecialConfig(body.specialConfig || body.special_config)
      : undefined;
  const saleConfig =
    body.saleConfig || body.sale_config
      ? normalizeSaleConfig(body.saleConfig || body.sale_config)
      : undefined;
  const bannerConfig =
    body.bannerConfig || body.banner_config
      ? normalizeBannerConfig(body.bannerConfig || body.banner_config)
      : undefined;
  const couponConfig =
    body.couponConfig || body.coupon_config
      ? normalizeCouponConfig(body.couponConfig || body.coupon_config)
      : undefined;
  const dealConfig =
    body.dealConfig || body.deal_config
      ? normalizeDealConfig(body.dealConfig || body.deal_config)
      : undefined;

  const out = {
    specialConfig: undefined,
    saleConfig: undefined,
    bannerConfig: undefined,
    couponConfig: undefined,
    dealConfig: undefined,
    dealConditions: [],
    dealRewards: [],
  };

  if (type === 'special') {
    out.specialConfig = specialConfig && Object.keys(specialConfig).length ? specialConfig : { highlightStyle: 'standard' };
  } else if (type === 'sale') {
    out.saleConfig = saleConfig;
  } else if (type === 'banner') {
    out.bannerConfig =
      bannerConfig && Object.keys(bannerConfig).length ? bannerConfig : { theme: 'default', textAlignment: 'left' };
  } else if (type === 'coupon') {
    out.couponConfig = couponConfig;
  } else if (type === 'deal') {
    out.dealConfig = dealConfig;
    out.dealConditions = normalizeDealConditions(body.dealConditions || body.deal_conditions);
    out.dealRewards = normalizeDealRewards(body.dealRewards || body.deal_rewards);
  }

  return out;
}

/**
 * Build document fields for create (full body).
 */
function buildPromotionCreatePayload(body, createdByUserId) {
  const src = body && typeof body === 'object' ? body : {};
  const type = String(src.type || '').trim();
  if (!PROMOTION_TYPES.includes(type)) {
    throw new Error(`Invalid promotion type: ${type}`);
  }

  const status = src.status != null ? String(src.status).trim() : 'draft';
  if (!PROMOTION_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const title = String(src.title || '').trim();
  if (!title) {
    throw new Error('title is required');
  }

  const typed = typedConfigsForType(type, src);

  if (type === 'sale' && !typed.saleConfig) {
    throw new Error('saleConfig with discountType and discountValue is required for type "sale"');
  }
  if (type === 'coupon' && !typed.couponConfig) {
    throw new Error('couponConfig with code and discountType is required for type "coupon"');
  }
  if (type === 'deal' && !typed.dealConfig) {
    throw new Error('dealConfig with dealType is required for type "deal"');
  }

  let createdBy = null;
  if (createdByUserId) {
    createdBy = oid(createdByUserId);
  }

  return {
    type,
    title,
    subtitle: src.subtitle != null ? String(src.subtitle).trim() : undefined,
    description: src.description != null ? String(src.description).trim() : undefined,
    status,
    imageUrl: src.imageUrl != null ? String(src.imageUrl).trim() : src.image_url != null ? String(src.image_url).trim() : undefined,
    mobileImageUrl:
      src.mobileImageUrl != null
        ? String(src.mobileImageUrl).trim()
        : src.mobile_image_url != null
          ? String(src.mobile_image_url).trim()
          : undefined,
    startAt: src.startAt || src.start_at ? new Date(src.startAt || src.start_at) : null,
    endAt: src.endAt || src.end_at ? new Date(src.endAt || src.end_at) : null,
    displayOrder: num(src.displayOrder ?? src.display_order, 0) ?? 0,
    isStackable: !!(src.isStackable ?? src.is_stackable),
    createdBy,
    targets: normalizeTargets(src.targets),
    placements: normalizePlacements(src.placements),
    audiences: normalizeAudiences(src.audiences),
    ...typed,
  };
}

/**
 * PATCH: merge top-level fields; replace arrays when key is present in body.
 */
function buildPromotionUpdatePatch(body, existing) {
  const src = body && typeof body === 'object' ? body : {};
  const patch = {};

  if (Object.prototype.hasOwnProperty.call(src, 'type')) {
    throw new Error('Cannot change promotion type via PATCH');
  }

  const type = existing.type;

  if (src.title !== undefined) {
    const title = String(src.title || '').trim();
    if (!title) throw new Error('title cannot be empty');
    patch.title = title;
  }
  if (src.subtitle !== undefined) patch.subtitle = String(src.subtitle).trim();
  if (src.description !== undefined) patch.description = String(src.description).trim();
  if (src.status !== undefined) {
    const status = String(src.status).trim();
    if (!PROMOTION_STATUSES.includes(status)) throw new Error(`Invalid status: ${status}`);
    patch.status = status;
  }
  if (src.imageUrl !== undefined) patch.imageUrl = src.imageUrl != null ? String(src.imageUrl).trim() : '';
  if (src.image_url !== undefined) patch.imageUrl = src.image_url != null ? String(src.image_url).trim() : '';
  if (src.mobileImageUrl !== undefined) {
    patch.mobileImageUrl = src.mobileImageUrl != null ? String(src.mobileImageUrl).trim() : '';
  }
  if (src.mobile_image_url !== undefined) {
    patch.mobileImageUrl = src.mobile_image_url != null ? String(src.mobile_image_url).trim() : '';
  }
  if (src.startAt !== undefined || src.start_at !== undefined) {
    const v = src.startAt !== undefined ? src.startAt : src.start_at;
    patch.startAt = v ? new Date(v) : null;
  }
  if (src.endAt !== undefined || src.end_at !== undefined) {
    const v = src.endAt !== undefined ? src.endAt : src.end_at;
    patch.endAt = v ? new Date(v) : null;
  }
  if (src.displayOrder !== undefined || src.display_order !== undefined) {
    patch.displayOrder = num(src.displayOrder ?? src.display_order, 0) ?? 0;
  }
  if (src.isStackable !== undefined || src.is_stackable !== undefined) {
    patch.isStackable = !!(src.isStackable ?? src.is_stackable);
  }

  if (Object.prototype.hasOwnProperty.call(src, 'targets')) {
    patch.targets = normalizeTargets(src.targets);
  }
  if (Object.prototype.hasOwnProperty.call(src, 'placements')) {
    patch.placements = normalizePlacements(src.placements);
  }
  if (Object.prototype.hasOwnProperty.call(src, 'audiences')) {
    patch.audiences = normalizeAudiences(src.audiences);
  }

  const hasTypedBody =
    Object.prototype.hasOwnProperty.call(src, 'specialConfig') ||
    Object.prototype.hasOwnProperty.call(src, 'special_config') ||
    Object.prototype.hasOwnProperty.call(src, 'saleConfig') ||
    Object.prototype.hasOwnProperty.call(src, 'sale_config') ||
    Object.prototype.hasOwnProperty.call(src, 'bannerConfig') ||
    Object.prototype.hasOwnProperty.call(src, 'banner_config') ||
    Object.prototype.hasOwnProperty.call(src, 'couponConfig') ||
    Object.prototype.hasOwnProperty.call(src, 'coupon_config') ||
    Object.prototype.hasOwnProperty.call(src, 'dealConfig') ||
    Object.prototype.hasOwnProperty.call(src, 'deal_config') ||
    Object.prototype.hasOwnProperty.call(src, 'dealConditions') ||
    Object.prototype.hasOwnProperty.call(src, 'deal_conditions') ||
    Object.prototype.hasOwnProperty.call(src, 'dealRewards') ||
    Object.prototype.hasOwnProperty.call(src, 'deal_rewards');

  if (hasTypedBody) {
    const ex = existing.toObject ? existing.toObject() : { ...existing };
    const bodyForTyped = {
      specialConfig: plainSubdoc(ex.specialConfig),
      saleConfig: plainSubdoc(ex.saleConfig),
      bannerConfig: plainSubdoc(ex.bannerConfig),
      couponConfig: plainSubdoc(ex.couponConfig),
      dealConfig: plainSubdoc(ex.dealConfig),
      dealConditions: Array.isArray(ex.dealConditions)
        ? ex.dealConditions.map((c) => (c.toObject ? c.toObject() : c))
        : [],
      dealRewards: Array.isArray(ex.dealRewards)
        ? ex.dealRewards.map((r) => (r.toObject ? r.toObject() : r))
        : [],
    };
    if (Object.prototype.hasOwnProperty.call(src, 'specialConfig') || Object.prototype.hasOwnProperty.call(src, 'special_config')) {
      const inc = src.specialConfig || src.special_config || {};
      bodyForTyped.specialConfig = { ...bodyForTyped.specialConfig, ...inc };
    }
    if (Object.prototype.hasOwnProperty.call(src, 'saleConfig') || Object.prototype.hasOwnProperty.call(src, 'sale_config')) {
      const inc = src.saleConfig || src.sale_config || {};
      bodyForTyped.saleConfig = { ...bodyForTyped.saleConfig, ...inc };
    }
    if (Object.prototype.hasOwnProperty.call(src, 'bannerConfig') || Object.prototype.hasOwnProperty.call(src, 'banner_config')) {
      const inc = src.bannerConfig || src.banner_config || {};
      bodyForTyped.bannerConfig = { ...bodyForTyped.bannerConfig, ...inc };
    }
    if (Object.prototype.hasOwnProperty.call(src, 'couponConfig') || Object.prototype.hasOwnProperty.call(src, 'coupon_config')) {
      const inc = src.couponConfig || src.coupon_config || {};
      bodyForTyped.couponConfig = { ...bodyForTyped.couponConfig, ...inc };
    }
    if (Object.prototype.hasOwnProperty.call(src, 'dealConfig') || Object.prototype.hasOwnProperty.call(src, 'deal_config')) {
      const inc = src.dealConfig || src.deal_config || {};
      bodyForTyped.dealConfig = { ...bodyForTyped.dealConfig, ...inc };
    }
    if (Object.prototype.hasOwnProperty.call(src, 'dealConditions') || Object.prototype.hasOwnProperty.call(src, 'deal_conditions')) {
      bodyForTyped.dealConditions = src.dealConditions || src.deal_conditions;
    }
    if (Object.prototype.hasOwnProperty.call(src, 'dealRewards') || Object.prototype.hasOwnProperty.call(src, 'deal_rewards')) {
      bodyForTyped.dealRewards = src.dealRewards || src.deal_rewards;
    }

    const typed = typedConfigsForType(type, bodyForTyped);
    if (type === 'sale' && !typed.saleConfig) {
      throw new Error('saleConfig with discountType and discountValue is required for type "sale"');
    }
    if (type === 'coupon' && !typed.couponConfig) {
      throw new Error('couponConfig with code and discountType is required for type "coupon"');
    }
    if (type === 'deal' && !typed.dealConfig) {
      throw new Error('dealConfig with dealType is required for type "deal"');
    }
    Object.assign(patch, typed);
  }

  return patch;
}

module.exports = {
  buildPromotionCreatePayload,
  buildPromotionUpdatePatch,
};
