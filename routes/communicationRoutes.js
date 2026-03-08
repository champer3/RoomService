const express = require("express");
const communicationController = require("./../controllers/communicationController");

const router = express.Router();

router
  .route("/")
  .get(communicationController.getAllCommunication)
  .post(communicationController.createCommunication);

router.route("/:userCommunications").get(communicationController.getUserCommunication)
router
  .route("/:communication")
  .get(communicationController.getCommunication)

module.exports = router;
