const express = require("express");
const departmentController = require("../controllers/departmentController");

const router = express.Router();

router.route("/").get(departmentController.getAllDepartments);
router.route("/:slug/fields").get(departmentController.getDepartmentFields);

module.exports = router;
