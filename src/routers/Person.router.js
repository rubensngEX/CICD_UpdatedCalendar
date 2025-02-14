const express = require("express");
const { uploadAvatar } = require("../middleware/cloudinaryMiddleware"); // Fix the import
const {
  getAllPersons,
  getPersonsById,
  updatePersonDetails,
  updatePersonAvatar,
  updatePersonPassword,
  deletePersonAccount,
  getAllPersonsInTheProject,
  getDevIdAndManId,
} = require("../models/Person.model");
const {
  comparePassword,
  hashPassword,
} = require("../middleware/argonMiddleware");
const jwtMiddleware = require("../middleware/jwtMiddleware");
const router = express.Router();

// Get all persons
router.get("/", jwtMiddleware.verifyToken, async (req, res, next) => {
  try {
    const persons = await getAllPersons();
    res.status(200).json(persons);
  } catch (error) {
    next(error || new Error("Failed to fetch persons"));
  }
});

// Get person by ID
router.get("/id", jwtMiddleware.verifyToken, async (req, res, next) => {
  const personId = res.locals.personId;
  if (isNaN(personId)) {
    return res.status(400).json({ error: "Invalid Login" });
  }
  try {
    const person = await getPersonsById(personId);
    res.status(200).json(person);
  } catch (error) {
    next(error || new Error("Failed to fetch person details"));
  }
});

// Fix the avatar upload route
router.put("/avatar", jwtMiddleware.verifyToken, uploadAvatar, async (req, res, next) => {
  const personId = res.locals.personId;

  try {
    const avatarUrl = req.avatarUrl;

    // Update the person record with the new avatar URL in the database
    const updatedPerson = await updatePersonAvatar(personId, avatarUrl);

    // Respond with the updated avatar URL
    if (updatedPerson) {
      return res.status(200).json({ status: true, avatar: avatarUrl });
    } else {
      return res.status(400).json({ status: false });
    }
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({ error: "Failed to update avatar." });
  }
});

// Update person details
router.put(
  "/updateDetails",
  jwtMiddleware.verifyToken,
  async (req, res, next) => {
    const personId = res.locals.personId;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Missing Parameter" });
    }
    try {
      const updatedPerson = await updatePersonDetails(personId, {
        name,
        email,
      });
      res
        .status(200)
        .json(updatedPerson ? { status: true } : { status: false });
    } catch (error) {
      next(error || new Error("Failed to update person details"));
    }
  }
);

// Update person password
router.put(
  "/updatePassword",
  jwtMiddleware.verifyToken,
  async (req, res, next) => {
    const personId = res.locals.personId;
    const { oldPassword, newPassword } = req.body;

    try {
      const updatedPassword = await updatePersonPassword(
        personId,
        oldPassword,
        newPassword
      );
      res
        .status(200)
        .json(updatedPassword ? { status: true } : { status: false });
    } catch (error) {
      next(error || new Error("Failed to update password"));
    }
  }
);

router.get("/:projId", (req, res, next) => {
  getAllPersonsInTheProject(parseInt(req.params.projId, 10))
    .then((persons) => res.status(200).json(persons))
    .catch(next);
});

router.get("/getDevIdAndManId/:projId/:personId", (req, res, next) => {
  getDevIdAndManId(
    parseInt(req.params.projId, 10),
    parseInt(req.params.personId, 10)
  )
    .then((persons) => res.status(200).json(persons))
    .catch(next);
});

// Fix the PUT route by providing a proper callback function
router.put("/:id", async (req, res, next) => {
  try {
    const personId = parseInt(req.params.id);
    if (isNaN(personId)) {
      return res.status(400).json({ error: "Invalid person ID" });
    }

    const updatedPerson = await personModel.updatePerson(personId, req.body);
    if (!updatedPerson) {
      return res.status(404).json({ error: "Person not found" });
    }
    res.json(updatedPerson);
  } catch (error) {
    logger.error(error, "Error updating person");
    next(error);
  }
});

module.exports = router;
