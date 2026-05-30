const Department = require("../Models/departmentModel");
const { getFieldsForDepartmentSlug } = require("../utils/departmentFieldService");

exports.getAllDepartments = async (req, res) => {
  try {
    const query = {};
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === "true";
    }
    const departments = await Department.find(query)
      .sort({ displayOrder: 1 })
      .lean();

    res.status(200).json({
      status: "success",
      results: departments.length,
      data: { departments },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

/**
 * GET /api/v1/departments/:slug/fields
 * Field definitions for dynamic Add Product “Department details” (from DepartmentField collection).
 * Query: includeInactive=true to include inactive fields.
 */
exports.getDepartmentFields = async (req, res) => {
  try {
    const { slug } = req.params;
    const includeInactive = req.query.includeInactive === "true";

    const result = await getFieldsForDepartmentSlug(slug, { includeInactive });
    if (!result) {
      return res.status(404).json({
        status: "fail",
        message: "Department not found",
      });
    }

    return res.status(200).json({
      status: "success",
      results: result.fields.length,
      data: {
        department: result.department,
        fields: result.fields,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};
