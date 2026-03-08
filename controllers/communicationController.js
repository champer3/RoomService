const communication = require("./../Models/communicationModel");

exports.getAllCommunication = async (req, res) => {
  try {
    const communication = await communication.find();
    res.status(200).json({
      status: "success",
      results: communication.length,
      data: {
        communication,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.createCommunication = async (req, res) => {
  try {
    const communication = await communication.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        communication,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getCommunication = async (req, res) => {
  try {
    const communication = await communication.findById(req.params.product);
    res.status(200).json({
      status: "success",
      data: {
        communication,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getUserCommunication = async (req, res) => {
    try {
      const userCommunications = await communication.find({userID: req.params.userCommunications});
      res.status(200).json({
        status: "success",
        results: userCommunications.length,
        data: {
          comms: userCommunications,
        },
      });
    } catch (err) {
      res.status(404).json({
        status: "fail",
        message: err,
      });
    }
  };