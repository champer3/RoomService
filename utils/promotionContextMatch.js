function idsEqual(a, b) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

/**
 * Whether promotion targets allow showing on this page context.
 * Empty targets or explicit "all" => everywhere.
 * With page context (dept/cat/product id), require a matching target.
 */
function promotionMatchesContext(doc, ctx = {}) {
  const { departmentId, categoryId, productId } = ctx;
  const targets = doc.targets || [];
  if (targets.length === 0) return true;

  if (targets.some((t) => t.targetType === 'all')) return true;

  const hasPageContext =
    departmentId != null || categoryId != null || productId != null;
  if (!hasPageContext) return false;

  return targets.some((t) => {
    if (t.targetType === 'department' && departmentId != null && idsEqual(t.targetId, departmentId))
      return true;
    if (t.targetType === 'category' && categoryId != null && idsEqual(t.targetId, categoryId))
      return true;
    if (t.targetType === 'product' && productId != null && idsEqual(t.targetId, productId))
      return true;
    return false;
  });
}

/**
 * Placement row matches surface/slot and optional context binding.
 */
function placementMatchesSurface(placement, surface, slots, ctx = {}) {
  if (!placement || placement.surface !== surface) return false;
  const slotList = Array.isArray(slots) ? slots : [slots];
  if (!slotList.includes(placement.slot)) return false;

  const { departmentId, categoryId, productId } = ctx;
  const ct = placement.contextType || 'none';
  const cid = placement.contextId;

  if (ct === 'none' || cid == null) return true;
  if (ct === 'department' && departmentId != null && idsEqual(cid, departmentId)) return true;
  if (ct === 'category' && categoryId != null && idsEqual(cid, categoryId)) return true;
  if (ct === 'product' && productId != null && idsEqual(cid, productId)) return true;

  return false;
}

module.exports = {
  idsEqual,
  promotionMatchesContext,
  placementMatchesSurface,
};
