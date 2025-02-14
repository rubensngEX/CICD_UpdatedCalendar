const { PrismaClient } = require('@prisma/client');
const { equal, notEqual } = require('assert');

const prisma = new PrismaClient()

module.exports.createTask = async function createTask(name, priority, projectId, status, personIds) {
  try {
    const task = await prisma.task.create({
      data: {
        name,
        priority,
        projectId,
        status,
        persons: {
          create: personIds.map((personId) => ({
            personId,
          })),
        },
      },
      include: {
        persons: true,
      },
    });

    return task;
  } catch (error) {
    console.error("Error creating task and assignments:", error);
    throw error;
  }
};
module.exports.assignMoreDeveloper = async function assignMoreDeveloper(taskId, personIds) {
  try {
    // Validate inputs
    if (!taskId || !Array.isArray(personIds) || personIds.length === 0) {
      throw new Error("Invalid inputs. Provide a valid taskId and an array of personIds.");
    }

    // Parse personIds into integers
    const parsedPersonIds = personIds.map((id) => {
      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId)) {
        throw new Error(`Invalid personId: ${id}. Must be a number.`);
      }
      return parsedId;
    });

    // Prepare data for bulk insertion
    const assignments = parsedPersonIds.map((personId) => ({
      taskId: taskId,
      personId: personId,
    }));

    // Create many TaskAssignment records
    const createdAssignments = await prisma.taskAssignment.createMany({
      data: assignments,
      skipDuplicates: true, // Ensures no duplicates if already assigned
    });

    return {
      message: `${createdAssignments.count} developers successfully assigned to task ${taskId}.`,
      count: createdAssignments.count,
    };
  } catch (error) {
    console.error("Error assigning developers to task:", error);
    throw error;
  }
};


module.exports.getAllTasks = function getAllTasks() {
  return prisma.task
    .findMany({
      select: {
        id: true,
        name: true,
        priority: true,
        status: true,
        Project: {
          select:{
            name: true
          }
        },
        persons: {
          select: {
            person: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
    })
    .then((tasks) => {
      return tasks;
    });
};
module.exports.getAllTasksByPersonId = function getAllTasksByPersonId(personId) {
  return prisma.task
    .findMany({
      select: {
        id: true,
        name: true,
        priority: true,
        status: true,
        Project: {
          select:{
            name: true
          }
        },
        persons: {
          select: {
            person: {
              select: {
                id: personId,
                name: true
              }
            }
          }
        }
      },
    })
    .then((tasks) => {
      return tasks;
    });
};

module.exports.getTasksByStatus = function getTasksByStatus(status) {
  return prisma.task
    .findMany({
      where: { status },
      select: {
        name: true,
        priority: true,
        status: true,
        Project: {
          select: {
            name: true
          },
        },
      },
    })
    .then((tasks) => {
      return tasks;
    });
};

module.exports.getTasksByProject = function getTasksByProject(projectId) {
  return prisma.task
    .findMany({
      where: { projectId },
      select: {
        name: true,
        priority: true,
        status: true,
        Project: {
          select: {
            name: true
          },
        },
      },
    })
    .then((tasks) => {
      return tasks;
    });
};

//alternative 
module.exports.getAllTasksByProjectId = function getAllTasksByProjectId(id) {
  return prisma.task
    .findMany({
      where: {
        projectId:{
          equals: id,
        } 
      },
      select: {
        id: true,
        name: true,
        priority: true,
        status: true,
        Project: {
          select: {
            name: true,
            projectManagerId: true
          },
        },
        persons: {
          select: {
            person: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: 'asc',  // 'asc' for ascending, 'desc' for descending
      },
    })
    .then((tasks) => {
      return tasks;
    });
};

module.exports.getAllTasksByPersonId = function getAllTasksByPersonId(personId) {
  return prisma.taskAssignment
    .findMany({
      where: { personId },
      select: {
        task:{
          select:{
            id: true,
            name: true,
            priority: true,
            status: true,
            Project:{
              select:{
                id: true,
                name: true,
              }
            }
          }
        }
      }
    })
    .then((tasks) => {
      return tasks;
    });
};

module.exports.getDevelopersByTaskId = async function getDevelopersByTaskId(taskId, personId) {
  try {
    const developers = await prisma.taskAssignment.findMany({
      where: {
        taskId: taskId,
        personId: {
          not: personId, // Exclude the specified personId
        },
      },
      select: {
        personId: true, // Select only the personId
      },
    });
    
    return developers.map((assignment) => assignment.personId); // Extract personId into an array
  } catch (error) {
    console.error("Error fetching developers by task ID:", error);
    throw error;
  }
};





module.exports.updateTask = function updateTask(id, data) {
  return prisma.task
    .update({
      where: { id },
      data,
    })
    .then((task) => {
      return task;
    });
};

module.exports.transferTask = async function transferTask(taskId, originalPersonId, newPersonId) {
  return await prisma.taskAssignment.update({
    where: { 
      taskId_personId: { // This uses the composite unique key generated by Prisma
        taskId: parseInt(taskId),
        personId: parseInt(originalPersonId),
      },
    },
    data: {
      personId: parseInt(newPersonId), // Update the personId with the new value
    },
  })
  .then((task) => {
    return task;
  })
  .catch((error) => {
    if (error.code === 'P2025') {
      // Record not found error
      return null;
    }
    console.error("Error updating task assignment:", error);
  });
};



module.exports.getTasksByUserId = function getTasksByUserId(userId) {
  try {
    return prisma.task
    .findMany({
      where: {
        persons: {
          some: {
            personId: userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        priority: true,
        status: true,
        Project: {
          select: {
            id: true,
            name: true,
          },
        },
        persons: {
          select: {
            person: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }).then((tasks) => {
      return tasks;
    })
  } catch (error) {
    console.error("Error fetching tasks for user ID:", error);
    throw error;
  }
};

module.exports.deleteTask = async function deleteTask(id) {
  try {
    // Delete all related TaskAssignment records first
    await prisma.taskAssignment.deleteMany({
      where: {
        taskId: id,
      },
    });

    // Delete the Task record
    const deletedTask = await prisma.task.delete({
      where: {
        id,
      },
    });

    return deletedTask;
  } catch (error) {
    console.error("Error deleting task and associated records:", error);
    throw error;
  }
};

module.exports.unassignTask = async function unassignTask(taskId, personId) {
  try {
    // Step 1: Find the taskAssignment by taskId and personId
    const taskAssignment = await prisma.taskAssignment.findFirst({
      where: {
        taskId: taskId,
        personId: personId,
      },
      select: {
        id: true, // Only retrieve the `id` field
      },
    });

    if (!taskAssignment) {
      throw new Error(`TaskAssignment not found for Task ID: ${taskId} and Person ID: ${personId}`);
    }

    // Step 2: Delete the taskAssignment by `id`
    const deletedTask = await prisma.taskAssignment.delete({
      where: {
        id: taskAssignment.id,
      },
    });

    return deletedTask;

  } catch (error) {
    console.error("Error unassigning task:", error);
    throw error;
  }
};

