const jwtMiddleware = require("../middleware/jwtMiddleware");
const express = require("express");
const router = express.Router();

const {
  getProjectByName
} = require("../models/Project.model");

const {
  developerAddedToNewProjectNoti,
  getDeveloperNoti,
  ReadTrue,
} = require("../models/Notification.model");


// Middleware to verify JWT
router.use(jwtMiddleware.verifyToken);

// Get noti by dev ID
router.get("/developer", async (req, res, next) => {
  // const personId = parseInt(req.params.personId, 10);
  const personId = parseInt(res.locals.personId, 10);
  
  try {
    const notis = await getDeveloperNoti(personId);
    res.status(200).json(notis);
  } catch (error) {
    next(error || new Error("Failed to fetch project details"));
  }
});
// Change isRead status on click
router.put("/isRead/:id", async (req, res, next) => {
  const recipientId = parseInt(req.params.id, 10);
  
  try {
    const isUpdated = await ReadTrue(recipientId);
    if(isUpdated)
      res.status(200);
    
  } catch (error) {
    next(error || new Error("Failed to fetch project details"));
  }
});

module.exports = router;
