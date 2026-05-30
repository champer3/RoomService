const mongoose = require('mongoose');
const Promotion = require('../Models/promotionModel');
const Department = require('../Models/departmentModel');
const Category = require('../Models/categoryModel');
const Product = require('../Models/productModel');
const { promotionMatchesContext, placementMatchesSurface } = require('../utils/promotionContextMatch');
const { toPromotionUI, buildNameMaps, formatMoney, idStr } = require('../services/promotionUiMapper');

function activePromotionFilter() {
  const now = new Date();
  return {
    status: 'active',
    $and: [
      { $or: [{ startAt: null }, { startAt: { $exists: false } }, { startAt: { $lte: now } }] },
      { $or: [{ endAt: null }, { endAt: { $exists: false } }, { endAt: { $gte: now } }] },
    ],
  };
}

function sortPlacementDocs(a, b) {
  const da = Number(a.displayOrder || 0);
  const db = Number(b.displayOrder || 0);
  if (da !== db) return da - db;
  return 0;
}

/**
 * Extract (doc, placement) pairs for surface + slots, filtered by targeting + placement context.
 */
function extractPlacedPromotions(docs, surface, slots, ctx) {
  const pairs = [];
  for (const doc of docs) {
    if (!promotionMatchesContext(doc, ctx)) continue;
    const placements = [...(doc.placements || [])].filter((p) =>
      placementMatchesSurface(p, surface, slots, ctx)
    );
    placements.sort(sortPlacementDocs);
    for (const p of placements) {
      pairs.push({ doc, placement: p });
    }
  }
  pairs.sort((a, b) => {
    const pa = sortPlacementDocs(a.placement, b.placement);
    if (pa !== 0) return pa;
    const docOrder = Number(a.doc.displayOrder || 0) - Number(b.doc.displayOrder || 0);
    if (docOrder !== 0) return docOrder;
    return new Date(a.doc.createdAt || 0) - new Date(b.doc.createdAt || 0);
  });
  return pairs;
}

async function mapPairsToUI(pairs) {
  if (pairs.length === 0) return [];
  const docs = [...new Set(pairs.map((x) => x.doc))];
  const maps = await buildNameMaps(docs, Department, Category, Product);
  return pairs.map(({ doc, placement }) => toPromotionUI(doc, placement, maps));
}

exports.getAppHome = async (req, res) => {
  try {
    const deptQuery = { isActive: true };
    const departments = await Department.find(deptQuery).sort({ displayOrder: 1 }).lean();

    const homeSlots = ['hero', 'featured_strip', 'section_card'];
    const promos = await Promotion.find({
      ...activePromotionFilter(),
      placements: {
        $elemMatch: { surface: 'home', slot: { $in: homeSlots } },
      },
    })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    const ctx = {};
    const heroPairs = extractPlacedPromotions(promos, 'home', ['hero'], ctx);
    const stripPairs = extractPlacedPromotions(promos, 'home', ['featured_strip'], ctx);
    const tilePairs = extractPlacedPromotions(promos, 'home', ['section_card'], ctx);

    const [hero, featuredStrip, tiles] = await Promise.all([
      mapPairsToUI(heroPairs),
      mapPairsToUI(stripPairs),
      mapPairsToUI(tilePairs),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        departments: departments.map((d) => ({
          id: idStr(d._id),
          name: d.name,
          slug: d.slug,
          iconUrl: d.iconUrl || '',
          layoutPreset: d.layoutPreset || 'food',
          categoryNavStyle: d.categoryNavStyle || 'tabs',
        })),
        promotions: {
          hero,
          featuredStrip,
          tiles,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: err.message || String(err),
    });
  }
};

exports.getAppDepartment = async (req, res) => {
  try {
    const { slug } = req.params;
    const department = await Department.findOne({ slug, isActive: true }).lean();
    if (!department) {
      return res.status(404).json({ status: 'fail', message: 'Department not found' });
    }

    const categories = await Category.find({ department: department._id, isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .select('name slug iconUrl imageUrl displayOrder')
      .lean();

    const deptId = department._id;
    const ctx = { departmentId: deptId };

    const promos = await Promotion.find({
      ...activePromotionFilter(),
      placements: {
        $elemMatch: {
          surface: 'department',
          slot: { $in: ['hero', 'top_banner', 'featured_strip'] },
        },
      },
    })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    /** Department — Hero (Food): surface department + slot hero (e.g. banner), scoped by placement context / targets */
    const heroPairs = extractPlacedPromotions(promos, 'department', ['hero'], ctx);
    const topPairs = extractPlacedPromotions(promos, 'department', ['top_banner'], ctx);
    const stripPairs = extractPlacedPromotions(promos, 'department', ['featured_strip'], ctx);

    const [hero, topBanner, featuredStrip] = await Promise.all([
      mapPairsToUI(heroPairs),
      mapPairsToUI(topPairs),
      mapPairsToUI(stripPairs),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        department: {
          id: idStr(department._id),
          name: department.name,
          slug: department.slug,
          iconUrl: department.iconUrl || '',
          layoutPreset: department.layoutPreset || 'food',
          categoryNavStyle: department.categoryNavStyle || 'tabs',
        },
        categories: categories.map((c) => ({
          id: idStr(c._id),
          name: c.name,
          slug: c.slug,
          iconUrl: c.iconUrl || '',
          imageUrl: c.imageUrl || '',
        })),
        promotions: {
          hero,
          topBanner,
          featuredStrip,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: err.message || String(err),
    });
  }
};

exports.getAppCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const deptSlugQ =
      req.query.departmentSlug != null ? String(req.query.departmentSlug).toLowerCase().trim() : '';

    const query = { slug, isActive: true };
    if (deptSlugQ) {
      const department = await Department.findOne({ slug: deptSlugQ, isActive: true }).select('_id').lean();
      if (department) {
        query.department = department._id;
      }
    }

    let category = await Category.findOne(query).populate('department', 'name slug').lean();

    /** Slug can repeat across departments; if department filter missed, fall back to global slug match */
    if (!category && deptSlugQ && query.department) {
      category = await Category.findOne({ slug, isActive: true }).populate('department', 'name slug').lean();
    }

    if (!category) {
      return res.status(404).json({ status: 'fail', message: 'Category not found' });
    }

    const catId = category._id;
    const dept = category.department;
    const ctx = {
      categoryId: catId,
      departmentId: dept && dept._id,
    };

    const promos = await Promotion.find({
      ...activePromotionFilter(),
      placements: {
        $elemMatch: {
          surface: 'category',
          slot: { $in: ['top_banner', 'inline_banner'] },
        },
      },
    })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    const topPairs = extractPlacedPromotions(promos, 'category', ['top_banner'], ctx);
    const inlinePairs = extractPlacedPromotions(promos, 'category', ['inline_banner'], ctx);

    const [topBanner, inline] = await Promise.all([
      mapPairsToUI(topPairs),
      mapPairsToUI(inlinePairs),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        category: {
          id: idStr(category._id),
          name: category.name,
          slug: category.slug,
          iconUrl: category.iconUrl || '',
          imageUrl: category.imageUrl || '',
          department: dept
            ? {
                id: idStr(dept._id),
                name: dept.name,
                slug: dept.slug,
              }
            : null,
        },
        promotions: {
          topBanner,
          inline,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: err.message || String(err),
    });
  }
};

const populateProduct = {
  path: 'category',
  select: 'name slug department',
  populate: { path: 'department', select: 'name slug _id' },
};

exports.getAppProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(String(productId))) {
      return res.status(400).json({ status: 'fail', message: 'Invalid product id' });
    }

    const product = await Product.findById(productId)
      .populate(populateProduct)
      .populate({ path: 'department', select: 'name slug iconUrl' })
      .lean();

    if (!product) {
      return res.status(404).json({ status: 'fail', message: 'Product not found' });
    }

    const catRef = product.category;
    const depRef = product.department;
    const ctx = {
      productId: product._id,
      categoryId: catRef && (catRef._id || catRef),
      departmentId: depRef && (depRef._id || depRef),
    };
    const promos = await Promotion.find({
      ...activePromotionFilter(),
      placements: {
        $elemMatch: {
          surface: 'product',
          slot: { $in: ['badge_area', 'inline_banner'] },
        },
      },
    })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    const badgePairs = extractPlacedPromotions(promos, 'product', ['badge_area'], ctx);
    const inlinePairs = extractPlacedPromotions(promos, 'product', ['inline_banner'], ctx);

    const [badgeArea, inline] = await Promise.all([
      mapPairsToUI(badgePairs),
      mapPairsToUI(inlinePairs),
    ]);

    const img = Array.isArray(product.images) && product.images.length ? product.images[0] : '';

    res.status(200).json({
      status: 'success',
      data: {
        product: {
          id: idStr(product._id),
          name: product.title,
          title: product.title,
          slug: product.slug || '',
          description: product.description || '',
          price: product.price,
          comparePrice: product.comparePrice,
          imageUrl: img,
          images: product.images || [],
          category: product.category,
          department: product.department,
        },
        promotions: {
          badgeArea,
          inline,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: err.message || String(err),
    });
  }
};

async function computeSubtotalFromItems(items) {
  const list = Array.isArray(items) ? items : [];
  const ids = [...new Set(list.map((i) => i.productId).filter(Boolean).map(String))];
  if (ids.length === 0) return 0;
  const prods = await Product.find({ _id: { $in: ids } })
    .select('price')
    .lean();
  const priceById = new Map(prods.map((p) => [String(p._id), Number(p.price || 0)]));
  let sum = 0;
  for (const line of list) {
    const pid = line.productId != null ? String(line.productId) : '';
    const unit = priceById.get(pid);
    if (unit == null) continue;
    sum += unit * Number(line.quantity || 1);
  }
  return Math.round(sum * 100) / 100;
}

const CART_PLACEMENT = {
  surface: 'cart',
  slot: 'summary_block',
  contextType: 'none',
  contextId: null,
  displayOrder: 0,
};

exports.postAppCartPromotions = async (req, res) => {
  try {
    const { items = [] } = req.body || {};
    const subtotal = await computeSubtotalFromItems(items);

    res.status(200).json({
      status: 'success',
      data: {
        appliedPromotions: [],
        summary: {
          subtotal,
          discountTotal: 0,
          deliveryFee: 0,
          tax: 0,
          total: subtotal,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: err.message || String(err),
    });
  }
};

exports.postAppApplyCoupon = async (req, res) => {
  try {
    const rawCode = (req.body && req.body.code) || '';
    const code = String(rawCode).trim().toUpperCase();
    if (!code) {
      return res.status(400).json({
        status: 'fail',
        error: { code: 'COUPON_CODE_REQUIRED', message: 'Coupon code is required' },
      });
    }

    const { items = [] } = req.body || {};
    const subtotal = await computeSubtotalFromItems(items);

    const now = new Date();
    const promo = await Promotion.findOne({
      type: 'coupon',
      status: 'active',
      'couponConfig.code': code,
      $and: [
        { $or: [{ startAt: null }, { startAt: { $exists: false } }, { startAt: { $lte: now } }] },
        { $or: [{ endAt: null }, { endAt: { $exists: false } }, { endAt: { $gte: now } }] },
      ],
    }).lean();

    if (!promo) {
      return res.status(400).json({
        status: 'fail',
        error: { code: 'COUPON_NOT_FOUND', message: 'Invalid or expired coupon code' },
      });
    }

    const cfg = promo.couponConfig || {};
    const minOrder = Number(cfg.minimumOrderAmount || 0);
    if (subtotal < minOrder) {
      return res.status(400).json({
        status: 'fail',
        error: {
          code: 'COUPON_NOT_ELIGIBLE',
          message: `This coupon requires a minimum order of ${formatMoney(minOrder)}`,
        },
      });
    }

    const maps = await buildNameMaps([promo], Department, Category, Product);
    const couponUi = toPromotionUI(promo, CART_PLACEMENT, maps);

    const dt = cfg.discountType;
    const dv = Number(cfg.discountValue || 0);
    let appliedAmount = 0;
    if (dt === 'percentage') {
      appliedAmount = Math.round(subtotal * (dv / 100) * 100) / 100;
    } else if (dt === 'fixed_amount') {
      appliedAmount = Math.min(dv, subtotal);
    } else if (dt === 'free_delivery') {
      appliedAmount = 0;
    }

    const discountTotal = appliedAmount;
    const total = Math.max(0, Math.round((subtotal - discountTotal) * 100) / 100);

    res.status(200).json({
      status: 'success',
      data: {
        coupon: couponUi,
        appliedAmount,
        summary: {
          subtotal,
          discountTotal,
          deliveryFee: 0,
          tax: 0,
          total,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: err.message || String(err),
    });
  }
};
