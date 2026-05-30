const mongoose = require('mongoose');
const Department = require('../Models/departmentModel');

function num(v, fallback) {
  if (v === '' || v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeVariantGroups(groups) {
  if (!Array.isArray(groups)) return [];
  return groups.map((g) => ({
    id: String(g.id || new mongoose.Types.ObjectId()),
    name: String(g.name || '').trim(),
    selectionType: g.selectionType === 'multiple' ? 'multiple' : 'single',
    required: !!g.required,
    choices: Array.isArray(g.choices)
      ? g.choices.map((c) => ({
          id: String(c.id || ''),
          name: String(c.name || '').trim(),
          priceDelta: num(c.priceDelta, 0) ?? 0,
        }))
      : [],
  }));
}

function normalizeAddons(list) {
  if (!Array.isArray(list)) return [];
  return list.map((a) => ({
    id: String(a.id || new mongoose.Types.ObjectId()),
    name: String(a.name || '').trim(),
    price: num(a.price, 0) ?? 0,
  }));
}

/**
 * Strip client-only keys and coerce types for Product create/update.
 */
async function buildProductPayload(body) {
  const src = body && typeof body === 'object' ? { ...body } : {};

  const productType = src.productType || src.departmentSlug;
  delete src.productType;
  delete src.departmentSlug;

  let departmentId = src.department;
  if (productType && !departmentId) {
    const dept = await Department.findOne({ slug: String(productType) }).select('_id').lean();
    if (dept) departmentId = dept._id;
  }
  delete src.department;

  const category = src.category;
  if (!category || !mongoose.isValidObjectId(String(category))) {
    throw new Error('Valid category is required');
  }

  const payload = {
    title: String(src.title || '').trim(),
    slug: src.slug ? String(src.slug).trim().toLowerCase() : undefined,
    shortDescription: src.shortDescription != null ? String(src.shortDescription).trim() : undefined,
    description: src.description != null ? String(src.description).trim() : undefined,
    images: Array.isArray(src.images) ? src.images.map(String) : [],
    category,
    department: departmentId || undefined,
    price: num(src.price, 0) ?? 0,
    comparePrice: num(src.comparePrice, undefined),
    cost: num(src.cost, undefined),
    stock: num(src.stock, 0) ?? 0,
    trackInventory: src.trackInventory !== false,
    lowStockThreshold: num(src.lowStockThreshold, undefined),
    sku: src.sku != null ? String(src.sku).trim() : undefined,
    availability: src.availability !== false,
    isFeatured: !!src.isFeatured,
    chefSpecial: !!src.chefSpecial,
    metadata:
      src.metadata && typeof src.metadata === 'object' && !Array.isArray(src.metadata)
        ? src.metadata
        : {},
    tags: Array.isArray(src.tags)
      ? src.tags.map((t) => String(t).trim()).filter(Boolean)
      : Array.isArray(src.related)
        ? src.related.map((t) => String(t).trim()).filter(Boolean)
        : [],
    variantGroups: normalizeVariantGroups(src.variantGroups),
    addons: normalizeAddons(src.addons),
  };

  if (payload.slug === '') delete payload.slug;
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  return payload;
}

/**
 * Partial update: only keys present in body are normalized (PATCH-safe).
 */
async function buildProductUpdatePatch(body) {
  const src = body && typeof body === 'object' ? body : {};
  const patch = {};

  if (src.title !== undefined) patch.title = String(src.title || '').trim();
  if (src.slug !== undefined) {
    const s = String(src.slug || '').trim().toLowerCase();
    if (s) patch.slug = s;
    else patch.slug = undefined;
  }
  if (src.shortDescription !== undefined)
    patch.shortDescription = String(src.shortDescription || '').trim();
  if (src.description !== undefined) patch.description = String(src.description || '').trim();
  if (src.images !== undefined)
    patch.images = Array.isArray(src.images) ? src.images.map(String) : [];

  if (src.category !== undefined) {
    const c = src.category;
    const id = c && typeof c === 'object' && c._id ? c._id : c;
    if (id && mongoose.isValidObjectId(String(id))) patch.category = id;
  }

  const productType = src.productType || src.departmentSlug;
  if (productType) {
    const dept = await Department.findOne({ slug: String(productType) }).select('_id').lean();
    if (dept) patch.department = dept._id;
  } else if (src.department !== undefined) {
    const d = src.department;
    const id = d && typeof d === 'object' && d._id ? d._id : d;
    if (id && mongoose.isValidObjectId(String(id))) patch.department = id;
  }

  if (src.price !== undefined) patch.price = num(src.price, 0) ?? 0;
  if (src.comparePrice !== undefined) patch.comparePrice = num(src.comparePrice, undefined);
  if (src.cost !== undefined) patch.cost = num(src.cost, undefined);
  if (src.stock !== undefined) patch.stock = num(src.stock, 0) ?? 0;
  if (src.trackInventory !== undefined) patch.trackInventory = src.trackInventory !== false;
  if (src.lowStockThreshold !== undefined)
    patch.lowStockThreshold = num(src.lowStockThreshold, undefined);
  if (src.sku !== undefined) patch.sku = String(src.sku || '').trim() || undefined;
  if (src.availability !== undefined) patch.availability = !!src.availability;
  if (src.isFeatured !== undefined) patch.isFeatured = !!src.isFeatured;
  if (src.chefSpecial !== undefined) patch.chefSpecial = !!src.chefSpecial;
  if (src.metadata !== undefined)
    patch.metadata =
      src.metadata && typeof src.metadata === 'object' && !Array.isArray(src.metadata)
        ? src.metadata
        : {};
  if (src.tags !== undefined)
    patch.tags = Array.isArray(src.tags)
      ? src.tags.map((t) => String(t).trim()).filter(Boolean)
      : [];
  else if (src.related !== undefined)
    patch.tags = Array.isArray(src.related)
      ? src.related.map((t) => String(t).trim()).filter(Boolean)
      : [];
  if (src.variantGroups !== undefined) patch.variantGroups = normalizeVariantGroups(src.variantGroups);
  if (src.addons !== undefined) patch.addons = normalizeAddons(src.addons);

  Object.keys(patch).forEach((k) => {
    if (patch[k] === undefined) delete patch[k];
  });
  return patch;
}

module.exports = {
  buildProductPayload,
  buildProductUpdatePatch,
  normalizeVariantGroups,
  normalizeAddons,
};
