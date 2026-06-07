const Department = require("../Models/departmentModel");
const { getFieldsForDepartmentSlug } = require("../utils/departmentFieldService");
const { getIO } = require("../socketManager");

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

exports.createDepartment = async (req, res) => {
  try {
    const department = await Department.create(req.body);
    const io = getIO();
    if (io) {
      io.emit('departmentUpdate', { type: 'created', department });
    }
    res.status(201).json({
      status: "success",
      data: { department },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!department) {
      return res.status(404).json({
        status: "fail",
        message: "Department not found",
      });
    }
    const io = getIO();
    if (io) {
      io.emit('departmentUpdate', { type: 'updated', department });
    }
    res.status(200).json({
      status: "success",
      data: { department },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({
        status: "fail",
        message: "Department not found",
      });
    }
    const io = getIO();
    if (io) {
      io.emit('departmentUpdate', { type: 'deleted', departmentId: req.params.id });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};
