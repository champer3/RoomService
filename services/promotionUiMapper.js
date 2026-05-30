const mongoose = require('mongoose');

function idStr(id) {
  if (id == null || id === '') return null;
  if (typeof id === 'object' && id._id != null) return String(id._id);
  return String(id);
}

function formatMoney(value) {
  const n = Number(value || 0);
  return `$${n.toFixed(2)}`;
}

function capitalizeWords(value = '') {
  return String(value)
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function describeConditionUI(c) {
  const v = c.conditionValue || {};
  switch (c.conditionType) {
    case 'product_quantity':
      return `Buy ${v.minQty || 1} ${v.productName || 'item(s)'}`;
    case 'category_quantity':
      return `Buy ${v.minQty || 1} from ${v.categoryName || 'category'}`;
    case 'department_subtotal':
      return `Spend ${formatMoney(v.minSubtotal || 0)} in ${v.departmentName || 'department'}`;
    case 'order_type':
      return `${(v.value || 'selected').toString().charAt(0).toUpperCase() + (v.value || '').toString().slice(1)} orders only`;
    case 'order_minimum':
      return `Orders over ${formatMoney(v.amount || 0)}`;
    case 'buy_quantity':
      return `Buy ${v.quantity || v.minQty || 1}+`;
    case 'buy_product':
      return `Buy ${v.productName || 'product'}`;
    case 'buy_category':
      return `Buy from ${v.categoryName || 'category'}`;
    default:
      return capitalizeWords(c.conditionType || 'condition');
  }
}

function describeRewardUI(r) {
  const v = r.rewardValue || {};
  switch (r.rewardType) {
    case 'free_product':
      return `Get ${v.qty || 1} free ${v.productName || 'item'}`;
    case 'free_addon':
      return `Free ${v.addonName || 'add-on'}`;
    case 'percentage_discount':
      return `${v.value || 0}% off`;
    case 'fixed_discount':
      return `${formatMoney(v.value || 0)} off`;
    case 'discount':
      return v.percent != null ? `${v.percent}% off` : `${formatMoney(v.amount || 0)} off`;
    case 'bundle_price':
      return `Bundle for ${formatMoney(v.value || 0)}`;
    case 'free_delivery':
      return 'Free delivery';
    default:
      return capitalizeWords(r.rewardType || 'reward');
  }
}

function lookupName(type, oid, maps) {
  if (!oid || type === 'none' || type === 'all') return '';
  const s = idStr(oid);
  if (!s) return '';
  if (type === 'department') return maps.departments.get(s) || '';
  if (type === 'category') return maps.categories.get(s) || '';
  if (type === 'product') return maps.products.get(s) || '';
  return '';
}

function buildBadge(promotion) {
  const type = promotion.type;
  const sc = promotion.specialConfig || {};
  const sac = promotion.saleConfig || {};
  const dc = promotion.dealConfig || {};
  const cc = promotion.couponConfig || {};

  switch (type) {
    case 'special':
      return {
        label: sc.badgeLabel || 'Special',
        tone: 'special',
      };
    case 'sale': {
      const dt = sac.discountType;
      const dv = Number(sac.discountValue || 0);
      const label =
        sac.badgeLabel ||
        (dt === 'percentage' ? `${dv}% OFF` : `${formatMoney(dv)} OFF`);
      return { label, tone: 'sale' };
    }
    case 'deal':
      return {
        label: dc.promoLabel || 'Deal',
        tone: 'deal',
      };
    case 'coupon':
      return { label: 'Coupon', tone: 'coupon' };
    case 'banner':
      return { label: 'Featured', tone: 'default' };
    default:
      return undefined;
  }
}

function buildCta(promotion) {
  const type = promotion.type;
  if (type === 'coupon') {
    const code = promotion.couponConfig?.code;
    return {
      label: 'Apply code',
      actionType: 'coupon',
      actionTarget: code ? String(code).toUpperCase() : null,
    };
  }
  if (type === 'special') {
    const c = promotion.specialConfig || {};
    if (!c.ctaLabel && !c.ctaType) return undefined;
    return {
      label: c.ctaLabel || 'Learn more',
      actionType: c.ctaType || 'none',
      actionTarget: c.ctaTarget || null,
    };
  }
  if (type === 'banner') {
    const c = promotion.bannerConfig || {};
    if (!c.buttonLabel && !c.buttonType) return undefined;
    return {
      label: c.buttonLabel || 'Learn more',
      actionType: c.buttonType || 'none',
      actionTarget: c.buttonTarget || null,
    };
  }
  if (type === 'deal') {
    const c = promotion.dealConfig || {};
    if (!c.ctaLabel) return undefined;
    return {
      label: c.ctaLabel,
      actionType: c.ctaType || 'none',
      actionTarget: c.ctaTarget || null,
    };
  }
  return undefined;
}

function buildPricing(promotion) {
  const type = promotion.type;
  if (type === 'sale') {
    const c = promotion.saleConfig || {};
    const dt = c.discountType;
    const dv = Number(c.discountValue || 0);
    return {
      discountType: dt,
      discountValue: dv,
      formattedDiscount:
        dt === 'percentage' ? `${dv}% OFF` : `${formatMoney(dv)} OFF`,
    };
  }
  if (type === 'coupon') {
    const c = promotion.couponConfig || {};
    const dt = c.discountType;
    const dv = Number(c.discountValue || 0);
    let formatted = '';
    if (dt === 'percentage') formatted = `${dv}% OFF`;
    else if (dt === 'free_delivery') formatted = 'FREE DELIVERY';
    else formatted = `${formatMoney(dv)} OFF`;
    return {
      discountType: dt,
      discountValue: dv,
      formattedDiscount: formatted,
    };
  }
  return undefined;
}

function buildDealBlock(promotion) {
  if (promotion.type !== 'deal') return undefined;
  const conditions = promotion.dealConditions || [];
  const rewards = promotion.dealRewards || [];
  const condStr = conditions[0] ? describeConditionUI(conditions[0]) : 'Condition';
  const rewStr = rewards[0] ? describeRewardUI(rewards[0]) : 'Reward';
  return {
    summary: `${condStr} • ${rewStr}`,
    conditionSummary: conditions.map(describeConditionUI),
    rewardSummary: rewards.map(describeRewardUI),
  };
}

function buildCouponBlock(promotion) {
  if (promotion.type !== 'coupon') return undefined;
  const c = promotion.couponConfig || {};
  const min = Number(c.minimumOrderAmount || 0);
  return {
    code: c.code ? String(c.code).toUpperCase() : undefined,
    minimumOrderAmount: min,
    formattedMinimumOrderAmount: formatMoney(min),
  };
}

function buildTargeting(promotion, maps) {
  const targets = (promotion.targets || []).map((t) => {
    const tt = t.targetType;
    const tid = t.targetId;
    return {
      type: tt,
      id: tid != null ? idStr(tid) : null,
      name: lookupName(tt, tid, maps) || undefined,
    };
  });

  const summaryParts = targets.map((t) => {
    if (t.type === 'all') return 'All';
    const label = t.name || t.type;
    return `${capitalizeWords(t.type)}${t.name ? `: ${t.name}` : ''}` || label;
  });

  return {
    summary: targets.length === 0 ? 'All products' : summaryParts.join(' • ') || 'All products',
    targets,
  };
}

function buildAudience(promotion) {
  const audiences = promotion.audiences || [];
  const rules = audiences.map((a) => ({
    type: a.audienceType,
    label: capitalizeWords(a.audienceType || 'rule'),
  }));
  return {
    summary: audiences.length === 0 ? 'All users' : rules.map((r) => r.label).join(' • '),
    rules,
  };
}

function buildMetadata(promotion) {
  const bc = promotion.bannerConfig || {};
  const sc = promotion.specialConfig || {};
  return {
    theme: bc.theme,
    textAlignment: bc.textAlignment,
    highlightStyle: sc.highlightStyle,
  };
}

/**
 * @param {object} promotion — lean Promotion doc
 * @param {object} placement — single placement subdoc used for this render
 * @param {{ departments: Map, categories: Map, products: Map }} maps
 */
function toPromotionUI(promotion, placement, maps) {
  const mapsSafe = maps || { departments: new Map(), categories: new Map(), products: new Map() };
  const ct = placement.contextType || 'none';
  const cid = placement.contextId;
  const contextName = lookupName(ct, cid, mapsSafe);

  const deal = buildDealBlock(promotion);
  const pricing = buildPricing(promotion);

  const bc = promotion.bannerConfig || {};
  const bannerHeadline = promotion.type === 'banner' && String(bc.headline || '').trim() ? bc.headline.trim() : '';
  const bannerSub = promotion.type === 'banner' && String(bc.subheadline || '').trim() ? bc.subheadline.trim() : '';

  return {
    id: idStr(promotion._id),
    type: promotion.type,
    title: bannerHeadline || promotion.title || '',
    subtitle: bannerSub || promotion.subtitle || '',
    description: promotion.description || '',
    status: promotion.status,
    imageUrl: promotion.imageUrl || '',
    mobileImageUrl: promotion.mobileImageUrl || '',
    startAt: promotion.startAt ? new Date(promotion.startAt).toISOString() : null,
    endAt: promotion.endAt ? new Date(promotion.endAt).toISOString() : null,
    badge: buildBadge(promotion),
    cta: buildCta(promotion),
    pricing,
    deal,
    coupon: buildCouponBlock(promotion),
    targeting: buildTargeting(promotion, mapsSafe),
    placement: {
      surface: placement.surface,
      slot: placement.slot,
      contextType: ct,
      contextId: cid != null ? idStr(cid) : null,
      contextName: contextName || undefined,
    },
    audience: buildAudience(promotion),
    metadata: buildMetadata(promotion),
  };
}

/**
 * Collect ObjectIds from promotions for bulk name lookup.
 */
function collectEntityIds(promotionDocs) {
  const departmentIds = new Set();
  const categoryIds = new Set();
  const productIds = new Set();

  const add = (set, id) => {
    if (id != null && mongoose.isValidObjectId(String(id))) set.add(String(id));
  };

  for (const doc of promotionDocs) {
    for (const t of doc.targets || []) {
      if (t.targetType === 'department') add(departmentIds, t.targetId);
      if (t.targetType === 'category') add(categoryIds, t.targetId);
      if (t.targetType === 'product') add(productIds, t.targetId);
    }
    for (const p of doc.placements || []) {
      if (p.contextType === 'department') add(departmentIds, p.contextId);
      if (p.contextType === 'category') add(categoryIds, p.contextId);
      if (p.contextType === 'product') add(productIds, p.contextId);
    }
  }

  return { departmentIds, categoryIds, productIds };
}

async function buildNameMaps(promotionDocs, Department, Category, Product) {
  const { departmentIds, categoryIds, productIds } = collectEntityIds(promotionDocs);
  const [depts, cats, prods] = await Promise.all([
    departmentIds.size
      ? Department.find({ _id: { $in: [...departmentIds] } })
          .select('name slug')
          .lean()
      : [],
    categoryIds.size
      ? Category.find({ _id: { $in: [...categoryIds] } })
          .select('name slug')
          .lean()
      : [],
    productIds.size
      ? Product.find({ _id: { $in: [...productIds] } })
          .select('title slug')
          .lean()
      : [],
  ]);

  const departments = new Map(depts.map((d) => [String(d._id), d.name]));
  const categories = new Map(cats.map((c) => [String(c._id), c.name]));
  const products = new Map(prods.map((p) => [String(p._id), p.title]));

  return { departments, categories, products };
}

module.exports = {
  toPromotionUI,
  buildNameMaps,
  collectEntityIds,
  formatMoney,
  idStr,
};
