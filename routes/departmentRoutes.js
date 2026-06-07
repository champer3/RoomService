const express = require("express");
const departmentController = require("../controllers/departmentController");

const router = express.Router();

router
  .route("/")
  .get(departmentController.getAllDepartments)
  .post(departmentController.createDepartment);

router
  .route("/:id")
  .patch(departmentController.updateDepartment)
  .delete(departmentController.deleteDepartment);

router.route("/:slug/fields").get(departmentController.getDepartmentFields);

module.exports = router;
