const express = require("express");
const jwtMiddleware = require("../middleware/jwtMiddleware");
const {
  getAllProjects,
  getNewDevelopers,
  getNewDevelopersForSingleProject,
  getAllDevelopersOfSingleProject,
  getDeveloperIdsInProject,
  getProjectById,
  getProjectDetails,
  getProjectsByManager,
  getProjectsByDeveloper,
  createProjectAsManager,
  addNewDeveloperForSingleProject,
  updateSingleProject,
  transferPeronInSingleProject,
  deletePersonInSingleProject,
  deleteSingleProject,
  getUnassignedDevelopersInProject,
  getProjectDeadlines,
  getDeveloperWorkLoad,
} = require("../models/Project.model");
const {
  developerAddedToNewProjectNoti,
  addProjectAnnouncement, createNoti
} = require("../models/Notification.model");
const { project } = require("../models/prismaClient");
const { type } = require("os");

const router = express.Router();

// Middleware to verify JWT
router.use(jwtMiddleware.verifyToken);

// Get all projects
router.get("/", async (req, res, next) => {
  try {
    const projects = await getAllProjects();
    res.status(200).json(projects);
  } catch (error) {
    next(error || new Error("Failed to fetch projects"));
  }
});

// Get all newDevelopers
router.get("/newDevelopers/:projId", async (req, res, next) => {
  const personId = res.locals.personId;
  if (isNaN(personId)) {
    return res.status(400).json({ error: "Invalid Login" });
  }
  const projId = parseInt(req.params.projId, 10);
  if (isNaN(personId) || projId == null) {
    return res.status(400).json({ error: "Missing Parameter" });
  }
  try {
    const newDevelopers = await getNewDevelopersForSingleProject(personId, projId);
    res.status(200).json(newDevelopers);
  } catch (error) {
    next(error || new Error("Failed to fetch new developers"));
  }
});

router.get("/developers", (req, res, next) => {
  const personId = res.locals.personId;
  if (isNaN(personId)) {
    return res.status(400).json({ error: "Invalid Login" });
  }
  getNewDevelopers(personId)
    .then((persons) => res.status(200).json(persons))
    .catch(next);
});

// Get detailed information of a project by ID
router.get("/details/:id", async (req, res, next) => {
  const projectId = parseInt(req.params.id, 10);
  if (isNaN(projectId)) {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  try {
    const projectDetails = await getProjectDetails(projectId);
    if (!projectDetails) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.status(200).json(projectDetails);
  } catch (error) {
    next(error || new Error("Failed to fetch project details"));
  }
});

// Get projects where the user is the manager
router.get("/asManager", async (req, res, next) => {
  const personId = res.locals.personId;
  console.log(`🚀 ~ router.get ~ personId:`, personId);
  try {
    const projects = await getProjectsByManager(personId);
    res.status(200).json(projects);
  } catch (error) {
    next(error || new Error("Failed to fetch projects as manager"));
  }
});

// Get projects where the user is a developer
router.get("/asDeveloper", async (req, res, next) => {
  const personId = res.locals.personId;

  try {
    const projects = await getProjectsByDeveloper(personId);
    res.status(200).json(projects);
  } catch (error) {
    next(error || new Error("Failed to fetch projects as developer"));
  }
});

router.get("/developersInSingleProject/:id", async (req, res, next) => {
  const projectId = parseInt(req.params.id, 10);

  if (isNaN(projectId)) {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  try {
    const developers = await getAllDevelopersOfSingleProject(projectId);
    res.status(200).json(developers);
  } catch (error) {
    next(error || new Error("Failed to fetch developers for the project"));
  }
});

////////////////////////TRANSFER & ASSIGN MORE//////////////////////////
router.get("/getUnassignedDevelopersInProject/:projectId/:taskId", async (req, res, next) => {
  const projectId = parseInt(req.params.projectId, 10);
  const taskId = parseInt(req.params.taskId, 10);

  if (isNaN(projectId)) {
    return res.status(400).json({ error: "Invalid project ID" });
  }
  if (isNaN(taskId)) {
    return res.status(400).json({ error: "Invalid task ID" });
  }

  try {
    const developers = await getUnassignedDevelopersInProject(taskId, projectId);
    res.status(200).json(developers);
  } catch (error) {
    next(error || new Error("Failed to fetch unassigned developers for the project"));
  }
});

// Get detailed information of a project by ID
router.get("/:id", async (req, res, next) => {
  const projectId = parseInt(req.params.id, 10);
  if (isNaN(projectId)) {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  try {
    const project= await getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.status(200).json(project);
  } catch (error) {
    next(error || new Error("Failed to fetch project details"));
  }
});

// Create a new project
router.post("/", async (req, res, next) => {
  const personId = res.locals.personId;

  const { projectName, projectDescription, deadline, developerIds = [] } = req.body;

  if (!projectName) {
    return res.status(400).json({ error: "Project name is required" });
  }

  if (!Array.isArray(developerIds)) {
    return res.status(400).json({ error: "Invalid developerIds format" });
  }

  try {
    const project = await createProjectAsManager(
      personId,
      projectName,
      projectDescription,
      deadline,
      developerIds
    );
    res.locals.projectId = project.id;
    next();
  } catch (error) {
    if (error.message.includes("Duplicate name error")) {
      return res.status(409).json({ error: "A project with the same name already exists. Please choose a different name." });
    }
    next(error || new Error("Failed to create project"));
  }
},
async (req, res, next) => {
  const projectId = res.locals.projectId;
  const taskId = res.locals.taskId;
  const { notiMsg, developerIds = [] } = req.body;

  try {
    const noti = await createNoti(
      projectId, null,
      "UPDATE",
      notiMsg,
      developerIds
    );
    res.status(201).json(noti);
  } catch (error) {
    next(error || new Error("Failed to create notification"));
  }
});

// Create a new project announcement
router.post("/announcement", async (req, res, next) => {
  const { projectIdStr, message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }
  if (!projectIdStr) {
    return res.status(400).json({ error: "Project id is required" });
  }

  let projectId = parseInt(projectIdStr, 10)
  
  const developerIds = await getDeveloperIdsInProject(projectId);
  console.log(`🚀 ~ router.post ~ developerIds:`, developerIds);

  if (!Array.isArray(developerIds)) {
    return res.status(400).json({ error: "Invalid developerIds format" });
  }


  try {
    const announcement = await createNoti(
      projectId, null,
      "ANNOUNCEMENT",
      message,
      developerIds
    );
    // res.locals.projectId = project.id;
    res.status(201).json(announcement);
  } catch (error) {
    next(error || new Error("Failed to create announcement"));
  }
});

router.post("/newDevelopers/:projId", async (req, res, next) => {
  const personId = res.locals.personId;
  const projectId = parseInt(req.params.projId, 10);
  const { developerIds } = req.body;

  if (isNaN(projectId)) {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  if (!Array.isArray(developerIds)) {
    return res.status(400).json({ error: "Developer IDs must be an array" });
  }

  try {
    const result = await addNewDeveloperForSingleProject(
      personId,
      projectId,
      developerIds
    );
    // res.status(200).json(result);
    res.locals.projectId = projectId;
    next();
  } catch (error) {
    next(error || new Error("Failed to add developers to the project"));
  }
}
,
async (req, res, next) => {
  const projectId = res.locals.projectId;
  const taskId = res.locals.taskId ;
  const { notiMsg, developerIds = [] } = req.body;
  
  try {
    const noti = await createNoti(
      projectId,
      taskId, "UPDATE",
      notiMsg,
      developerIds
    );
    res.status(201).json(noti);
  } catch (error) {
    next(error || new Error("Failed to create noti"));
  }
  });

// Update a project
router.put("/:id", async (req, res, next) => {
  const projectId = parseInt(req.params.id, 10);
  const personId = res.locals.personId;
  const { projectName, projectDescription } = req.body;

  if (isNaN(projectId)) {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  try {
    const updatedProject = await updateSingleProject(
      personId,
      projectId,
      projectName,
      projectDescription
    );
    if (!updatedProject) {
      return res
        .status(403)
        .json({ error: "Unauthorized to update this project" });
    }
    res.status(200).json(updatedProject);
  } catch (error) {
    next(error || new Error("Failed to update project"));
  }
});

// Update project details and reassign tasks
router.put("/:projectId/update", async (req, res, next) => {
  const projectManagerId = res.locals.personId;
  const projectId = parseInt(req.params.projectId, 10);
  const { transferringId, transferredId } = req.body;

  if (!projectId || !transferringId || !transferredId) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  try {
    const result = await updateSingleProject(
      projectManagerId,
      projectId,
      transferringId,
      transferredId
    );
    res.status(200).json(result);
  } catch (error) {
    next(error || new Error("Failed to update project."));
  }
});

// Transfer person within a project
router.put("/transfer/:projectId", async (req, res, next) => {
  const projectManagerId = res.locals.personId;
  const projectId = parseInt(req.params.projectId, 10);
  const { transferringId, transferredId } = req.body;

  if (!projectId || !transferringId || !transferredId) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  try {
    const result = await transferPeronInSingleProject(
      projectManagerId,
      projectId, 
      parseInt(transferringId, 10),
      parseInt(transferredId, 10)
    );
    res.status(200).json(result.message);
  } catch (error) {
    next(error || new Error("Failed to transfer person."));
  }
});

// Delete a project
router.delete("/:id", async (req, res, next) => {
  const projectId = parseInt(req.params.id, 10);
  const personId = res.locals.personId;

  if (isNaN(projectId)) {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  try {
    const deletedProject = await deleteSingleProject(personId, projectId);
    if (!deletedProject) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this project" });
    }
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    next(error || new Error("Failed to delete project"));
  }
});

// Remove person from a project
router.delete("/remove/:projectId", async (req, res, next) => {
  const projectManagerId = res.locals.personId;
  const projectId = parseInt(req.params.projectId, 10);
  const { removedPersonId } = req.body;

  if (!projectId || !removedPersonId) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  try {
    const result = await deletePersonInSingleProject(
      projectManagerId,
      projectId,
      parseInt(removedPersonId, 10)
    );
    res.status(200).json(result);
  } catch (error) {
    next(error || new Error("Failed to remove person from the project."));
  }
});

router.get("/deadlines/:personId", (req, res, next) => {
  const personId = res.locals.personId;
  if (isNaN(personId)) {
    return res.status(400).json({ error: "Invalid Login" });
  }
  getProjectDeadlines(personId)
    .then((dates) => res.status(200).json(dates))
    .catch(next);
});


//get developer workload
router.get("/getDeveloperWorkLoad/:projectId", async (req,res,next) => {
  const projectId = parseInt(req.params.projectId, 10);
  try {
    const result = await getDeveloperWorkLoad(projectId)
    res.status(200).json(result);
  }catch (error) {
    next(error || new Error("Failed to remove person from the project."));
  }
}) 
module.exports = router;
