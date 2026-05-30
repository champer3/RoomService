const Department = require('../Models/departmentModel');
const DepartmentField = require('../Models/departmentFieldModel');

function toPublicFieldDefinition(fieldDoc) {
  if (!fieldDoc) return null;
  return {
    fieldKey: fieldDoc.fieldKey,
    fieldLabel: fieldDoc.fieldLabel,
    fieldType: fieldDoc.fieldType,
    placeholder: fieldDoc.placeholder,
    helpText: fieldDoc.helpText,
    isRequired: fieldDoc.isRequired,
    isActive: fieldDoc.isActive,
    sortOrder: fieldDoc.sortOrder,
    options: fieldDoc.options,
    validationRules: fieldDoc.validationRules,
    defaultValue: fieldDoc.defaultValue,
  };
}

async function getFieldsForDepartmentSlug(slug, opts = {}) {
  const includeInactive = opts.includeInactive === true;
  const dept = await Department.findOne({ slug }).lean();
  if (!dept) return null;

  const q = { department: dept._id };
  if (!includeInactive) q.isActive = true;

  const raw = await DepartmentField.find(q)
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  return {
    department: {
      _id: dept._id,
      name: dept.name,
      slug: dept.slug,
      iconUrl: dept.iconUrl,
      description: dept.description,
    },
    fields: raw.map(toPublicFieldDefinition),
  };
}

module.exports = {
  getFieldsForDepartmentSlug,
  toPublicFieldDefinition,
};
