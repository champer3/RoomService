const mongoose = require('mongoose');

const departmentFieldSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    fieldKey: {
      type: String,
      required: true,
      maxlength: 100,
    },
    fieldLabel: {
      type: String,
      required: true,
      maxlength: 120,
    },
    fieldType: {
      type: String,
      required: true,
      maxlength: 50,
    },
    placeholder: {
      type: String,
    },
    helpText: {
      type: String,
    },
    isRequired: {
      type: Boolean,
      required: true,
      default: false,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    sortOrder: {
      type: Number,
      required: true,
      default: 0,
    },
    // UI / validation config
    options: {
      type: mongoose.Schema.Types.Mixed,
    },
    validationRules: {
      type: mongoose.Schema.Types.Mixed,
    },
    defaultValue: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

departmentFieldSchema.index(
  { department: 1, fieldKey: 1 },
  { unique: true, name: 'unique_department_field_key' }
);

departmentFieldSchema.index({ department: 1 });
departmentFieldSchema.index({ department: 1, isActive: 1, sortOrder: 1 });

const DepartmentField = mongoose.model('DepartmentField', departmentFieldSchema);

module.exports = DepartmentField;

