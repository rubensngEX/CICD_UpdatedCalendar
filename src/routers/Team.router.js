const express = require("express");
const router = express.Router();
const jwtMiddleware = require("../middleware/jwtMiddleware");
const { createTeam,getMyJoinRequests, joinTeamByCode, getTeamById, getTeamPersons, requestToJoinTeam, getPendingRequests, getTeamRequests, acceptTeamRequest, rejectTeamRequest, getProjectsByTeamId, requestJoinProject, updateJoinRequestApproval } = require("../models/Team.model"); // Updated import

//noti
const { createNoti } = require("../models/Notification.model"); // Updated import
const { getPersonsById } = require("../models/Person.model"); // Updated import
const { getProjectById } = require("../models/Project.model"); // Updated import
const { addNewDeveloperForSingleProject } = require("../models/Project.model"); // Updated import


router.use(jwtMiddleware.verifyToken);

router.get("/project/:teamId", async (req,res,next) => {
  const teamId = parseInt(req.params.teamId, 10);
  console.log(teamId, "at router")

  if (isNaN(teamId)) {
    return res.status(400).json({ error: "Invalid team ID" });
}

try {
    const projects = await getProjectsByTeamId(teamId);

    if (!projects) {
        return res.status(404).json({ error: "Team not found" });
    }

    res.status(200).json(projects);
} catch (error) {
    console.error("Error fetching team:", error);
    next(error || new Error("Failed to fetch team details."));
}
})
router.get("/getMyRequests", async (req, res, next) => {
  const personId = res.locals.personId;
  if (!personId) {
    return res.status(400).json({ error: "User ID not found in session" });
  }

  try {
    const requests = await getMyJoinRequests(parseInt(personId));
    res.status(200).json(requests);
  } catch (error) {
    next(error);
  }
});
router.get("/persons", async (req, res, next) => {
  const personId = res.locals.personId;

  try {
    const persons = await getTeamPersons(personId);
    res.status(200).json(persons);
  } catch (error) {
    if (error.message.includes("User is not part of any team")) {
      console.error("User is not part of any team.");
      return res.status(400).json({ error: "You are not part of any team. Please create or join a team." });
    }

    console.error("Error fetching team persons:", error.message);
    next(error || new Error("Failed to fetch team persons."));
  }
});

router.get("/pending", async (req, res, next) => {
  const personId = res.locals.personId;

  try {
      const requests = await getPendingRequests(personId);
      res.status(200).json(requests);
  } catch (error) {
      console.error("Error fetching pending requests:", error);
      return res.status(500).json({ error: "Failed to fetch pending requests." });
  }
});

router.get("/:teamId/requests", async (req, res, next) => {
  const teamId = parseInt(req.params.teamId, 10);

  if (isNaN(teamId)) {
      return res.status(400).json({ error: "Invalid team ID" });
  }

  try {
      const requests = await getTeamRequests(teamId);
      res.status(200).json(requests);
  } catch (error) {
      console.error("Error fetching team requests:", error);
      return res.status(500).json({ error: "Failed to fetch team requests." });
  }
});

router.get("/:teamId", async (req, res, next) => {
  const teamId = parseInt(req.params.teamId, 10);

  if (isNaN(teamId)) {
      return res.status(400).json({ error: "Invalid team ID" });
  }

  try {
      const team = await getTeamById(teamId);

      if (!team) {
          return res.status(404).json({ error: "Team not found" });
      }

      res.status(200).json(team);
  } catch (error) {
      console.error("Error fetching team:", error);
      next(error || new Error("Failed to fetch team details."));
  }
});


// Route to create a team
router.post("/", async (req, res, next) => {
  console.log("Received request to create a team");

  const { teamName } = req.body;
  const personId = res.locals.personId;

  if (!teamName) {
    return res.status(400).json({ error: "Team name is required" });
  }

  if (!personId) {
    return res.status(401).json({ error: "Unauthorized: Missing personId from token" });
  }

  try {
    const team = await createTeam(teamName, personId);
    res.status(201).json({ 
      message: "Team created successfully", 
      teamCode: team.teamCode  // Return generated team code
    });
  } catch (error) {
    next(error || new Error("Failed to create team"));
  }
});

// Route to join a team by code
router.post("/join", async (req, res, next) => {
  const personId = res.locals.personId;
  const { teamCode } = req.body;

  if (!teamCode) {
    return res.status(400).json({ error: "Team code is required" });
  }

  try {
    const response = await requestToJoinTeam(personId, teamCode);
    res.status(200).json({ message: "Join request submitted successfully.", response });
  } catch (error) {
    next(error || new Error("Failed to submit join request."));
  }
});

// Accept a team request
router.post("/requests/:requestId/accept", async (req, res, next) => {
  const requestId = parseInt(req.params.requestId, 10);

  try {
      const result = await acceptTeamRequest(requestId);
      res.status(200).json(result);
  } catch (error) {
      console.error("Error accepting request:", error);
      next(error || new Error("Failed to accept request."));
  }
});
router.post("/joinProject", async (req, res, next) => {
  const personId = res.locals.personId;
  const { projectId } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: "Project ID cannot be retrieved" });
  }

  try {
    const updatedPerson = await requestJoinProject (personId, parseInt(projectId));
    if (!updatedPerson) {
      return res.status(404).json({ error: "Person not found" });
    }
    res.locals.updatedPerson = updatedPerson;
    res.locals.message = `Successfully requested to join team! Pending approval from project manager`;
    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
}
//noti
, async (req, res, next) => {
  const personId = res.locals.personId;
  const { projectId } = req.body;
  let projId = parseInt(projectId);
  const person = await getPersonsById(personId);
  console.log(`🚀 ~ router.post ~ person:`, person);
  const project = await getProjectById(projId);
  console.log(`🚀 ~ router.post ~ project:`, project);

  try {
    const newNoti = await createNoti(projId, null, "REQUEST", `${person.email} has requested to join the project ${project.name}`, [project.projectManagerId] ,personId);
    if(!newNoti){
      console.log("Notification creation failed:");
    }else
      res.status(200).json({ message: res.locals.message ,updatedPerson:res.locals.updatedPerson });
  } catch (error) {
    console.error(error);
    next(error);
  }

});

// Reject a team request
router.post("/requests/:requestId/reject", async (req, res, next) => {
  const requestId = parseInt(req.params.requestId, 10);

  try {
      const result = await rejectTeamRequest(requestId);
      res.status(200).json(result);
  } catch (error) {
      console.error("Error rejecting request:", error);
      next(error || new Error("Failed to reject request."));
  }
});


// ✅ this one for noti guys
router.put("/joinRequests", async (req, res, next) => {
  // const { requestId } = req.params;
  const { approve, requesterId, projectId } = req.body; // true = approve, false = reject

  if (approve === undefined) {
    return res.status(400).json({ error: "Approval status is required" });
  }

  try {
    const updatedRequest = await updateJoinRequestApproval(parseInt(projectId), parseInt(requesterId), approve);
    if (!updatedRequest) {
      return res.status(404).json({ error: "Request not found" });
    } else
    res.locals.message = "Request updated successfully";
    next();
  } catch (error) {
    next(error);
  }
}, 
async (req, res, next) => {
  const { approve, requesterId, projectId, pmId} = req.body;

  if(approve === false)
    res.status(200).json({ message: res.locals.message });

  try {
    const msg = await addNewDeveloperForSingleProject(pmId, projectId, [requesterId]);
    if(!msg){
      console.log("addNewDeveloperForSingleProject failed:");
    }else
    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
},
async (req, res, next) => {
  const { requesterId, projectId} = req.body;
  const project = await getProjectById(projectId);

  try {
    const newNoti = await createNoti(projectId, null, "UPDATE", `Your request to join Project:${project.name} has been approved.`, [requesterId] );
    if(!newNoti){
      console.log("Notification creation failed:");
    }else
      res.status(200).json({ message: res.locals.message });
  } catch (error) {
    console.error(error);
    next(error);
  }
}
);

module.exports = router;
