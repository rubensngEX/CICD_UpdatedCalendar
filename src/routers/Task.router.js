const express = require('express');
const jwtMiddleware = require("../middleware/jwtMiddleware");

const router = express.Router();
const {
  createTask,
  getAllTasks,
  getTasksByStatus,
  getAllTasksByProjectId,
  updateTask,
  deleteTask,
  getAllTasksByPersonId,
  unassignTask,
  transferTask,
  assignMoreDeveloper,
  getDevelopersByTaskId,
} = require('../models/Task.model');
const {
  createNoti
} = require("../models/Notification.model");
const { rmSync } = require('fs');
// Create a new task
// eslint-disable-next-line no-unused-vars

// router.use(jwtMiddleware.verifyToken);

router.post('/', async (req, res, next) => {
  try {
    const { name, priority, projectId, status, assignedPersonId } = req.body;

    const task = await createTask(name, priority, projectId, status, assignedPersonId);
    // res.status(201).json(task);
    res.locals.projectId = projectId;
    res.locals.taskId = task.id;
    next();
  } catch (error) {
    console.error("Error in route handler:", error);
    res.status(500).json({ error: error.message });
  }
}
,
async (req, res, next) => {
  const projectId = res.locals.projectId;
  const taskId = res.locals.taskId;
  const { notiMsg, assignedPersonId = [] } = req.body;
  
  try {
    const noti = await createNoti(
      projectId,
      taskId, "UPDATE",
      notiMsg,
      assignedPersonId
    );
    res.status(201).json(noti);
  } catch (error) {
    next(error || new Error("Failed to create noti"));
  }
});


// Retrieve all tasks
router.get('/', (req, res, next) => {
  getAllTasks()
    .then((tasks) => res.status(200).json(tasks))
    .catch(next);
});

// Retrieve tasks by status
router.get('/status/:statusWord', (req, res, next) => {
  const { statusWord } = req.params;
  getTasksByStatus(statusWord.toUpperCase())
    .then((tasks) => res.status(200).json(tasks))
    .catch(next);
});

// Retrieve tasks by project
router.get('/project/:projectId', (req, res, next) => {
  const { projectId } = req.params;
  getAllTasksByProjectId(parseInt(projectId))
    .then((tasks) => res.status(200).json(tasks))
    .catch(next);
});
// Retrieve tasks by personId
router.get('/member/:memberId', (req, res, next) => {
  const { memberId } = req.params;
  getAllTasksByPersonId(parseInt(memberId))
    .then((tasks) => res.status(200).json(tasks))
    .catch(next);
});


// Retrieve tasks by user ID
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
      const tasks = await getTasksByUserId(parseInt(userId));
      if (!tasks) {
          return res.status(404).json({ error: "No tasks found for the user." });
      }
      res.status(200).json(tasks);
  } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Internal server error" });
  }
});
// =======
// // Retrieve tasks by person
// router.get('/person/:personId', (req, res, next) => {
//   const { personId } = req.params;
//   getAllTasksByPersonId(parseInt(personId))
//     .then((tasks) => res.status(200).json(tasks))
//     .catch(next);
// });

// >>>>>>> frontend-manageProject

// Update a task
router.put('/:taskId/:projectId/:personId', (req, res, next) => {
  const { taskId } = req.params;
  const data = req.body;
  updateTask(parseInt(taskId), data)
    .then(() => next())
    .catch(next);
}
, 
async (req, res, next) => {
  const projectId = parseInt(req.params.projectId, 10); // Ensure base 10 parsing
  const taskId = parseInt(req.params.taskId, 10); // Ensure base 10 parsing
  const data = req.body;
  
  let notiMsg = '';
  
  if (data && typeof data === 'object') { // Ensure `data` is defined and is an object
    if (data.status != null && data.priority != null) { 
      // Both `status` and `priority` exist
      notiMsg = `Your task status was updated to ${data.status} and priority was updated to ${data.priority}!`;
    } else if (data.status != null) { 
      // Only `status` exists
      notiMsg = `Your task status was updated to ${data.status}!`;
    } else if (data.priority != null) { 
      // Only `priority` exists
      notiMsg = `Your task priority was updated to ${data.priority}!`;
    }
  } else {
    notiMsg = "Invalid data provided."; // Handle cases where `data` is missing or not an object
  } 

  try {
    const developerIds = await getDevelopersByTaskId(taskId, parseInt(req.params.personId))
  
  
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

// Transfer a person
router.put('/assignment/:taskId/:originalPersonId/transfer/:personId/:projectId', async (req, res, next) => {
  const { taskId, originalPersonId, personId  } = req.params;
  if (isNaN(taskId) || isNaN(personId) || isNaN(originalPersonId)) {
    return res.status(400).json({ error: "Invalid ID or personId" });
  }
  try {
    await transferTask(parseInt(taskId), parseInt(originalPersonId),parseInt(personId))
    .then((task) => {
      if (!task) {
        return res.status(404).json({ error: "Task assignment not found" });
      }
      else
        // return res.status(200).json(task);
      res.locals.personId = parseInt(personId);
      res.locals.taskId = parseInt(taskId);
      next()
    })
    .catch((error) => {
      if (error.code === 'P2025') {
        // Record not found error
        return res.status(404).json({ error: "Task assignment not found" });
      }
      next(error || new Error("Failed to transfer task"));
    });
  } catch (error) {
    next(error || new Error("Failed to transfer task"));
  }
}
,
async (req, res, next) => {
  const projectId = parseInt(req.params.projectId);
  const taskId = res.locals.taskId;
  const notiMsg = `You have been transferred a task!`;
  const developerIds = [res.locals.personId];

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


router.post('/assignMore/:taskId/:projectId', async (req, res, next) => {
  const taskId = req.params.taskId;
  const { developerIds } = req.body;
  if (isNaN(taskId)) {
    return res.status(400).json({ error: "Invalid task ID"});
  }

  try {
    await assignMoreDeveloper(parseInt(taskId), developerIds)
    .then((result) => {
      next();
        // return res.status(200).json(result.message);
    })
    .catch((error) => {
      if (error.code === 'P2025') {
        // Record not found error
        return res.status(404).json({ error: "Task assignment not found" });
      }
      next(error || new Error("Failed to transfer task"));
    });
  } catch (error) {
    next(error || new Error("Failed to transfer task"));
  }
}
,
async (req, res, next) => {
  const projectId = parseInt(req.params.projectId);
  const taskId = parseInt(req.params.taskId);
  const notiMsg = `You have been assigned a new task!`;
  const { developerIds } = req.body;

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

// Delete a task
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;
  deleteTask(parseInt(id))
    .then((task) => res.status(200).json(task))
    .catch(next);
});

// Unassign a task
router.delete('/assignment/:id/unassign/:personId/projectId/:projectId', (req, res, next) => {
  const { id, personId } = req.params;
  if (isNaN(id) || isNaN(personId)) {
    return res.status(400).json({ error: "Invalid ID or personId" });
  }
  try {
    unassignTask(parseInt(id), parseInt(personId))
    .then((task) => {
      if (!task) {
        return res.status(404).json({ error: "Task assignment not found" });
      }
      // res.locals.taskId = id;
      // res.status(200).json(task);
      res.locals.personId = personId;
      next();
    })
    .catch((error) => {
      if (error.code === 'P2025') {
        // Record not found error
        return res.status(404).json({ error: "Task assignment not found" });
      }
      next(error || new Error("Failed to unassign task"));
    });
  } catch (error) {
    next(error || new Error("Failed to unassign task"));
  }   
}
,
async (req, res, next) => {
  const projectId = parseInt(req.params.projectId);
  const taskId = res.locals.taskId;
  const notiMsg = `You have been unassigned from a task!`;
  const developerIds = [res.locals.personId];

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

module.exports = router;
