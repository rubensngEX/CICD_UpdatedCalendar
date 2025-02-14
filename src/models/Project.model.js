const prisma = require("./prismaClient");
const { subDays, eachDayOfInterval, format } = require("date-fns");
module.exports.getAllProjects = async function getAllProjects() {
  return prisma.project.findMany();
};

module.exports.getNewDevelopers = async function getNewDevelopers(personId) {
  // Find the project manager's teamId
  const projectManager = await prisma.person.findUnique({
    where: { id: personId },
    select: { teamId: true },
  });

  if (!projectManager || !projectManager.teamId) {
    throw new Error("Project manager or team ID not found");
  }

  // Fetch developers from the same team, excluding the project manager
  return prisma.person.findMany({
    where: {
      teamId: projectManager.teamId, // Match team ID
      id: { not: personId }, // Exclude the given person
    },
  });
};

module.exports.getNewDevelopersForSingleProject =
  async function getNewDevelopersForSingleProject(personId, projectId) {
    // Fetch the project details including its project manager ID and team ID
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        projectManagerId: true,
        teamId: true,
      },
    });

    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    // Ensure the requesting person is the project manager
    if (project.projectManagerId !== personId) {
      throw new Error(
        `Person with ID ${personId} is not the project manager of project ID ${projectId}`
      );
    }

    // Get all persons already assigned to the project
    const assignedPersonIds = (
      await prisma.projectPerson.findMany({
        where: { projectId },
        select: { personId: true },
      })
    ).map((projectPerson) => projectPerson.personId);

    // Fetch new developers who:
    // - Belong to the same team as the project
    // - Are not the project manager (by their ID)
    // - Are not already assigned to the project
    const newDevelopers = await prisma.person.findMany({
      where: {
        teamId: project.teamId, // Must be in the same team
        id: {
          notIn: [...assignedPersonIds, personId, project.projectManagerId], // Exclude project members, requester, and project manager
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return newDevelopers;
  };

module.exports.getAllDevelopersOfSingleProject = async function getAllDevelopersOfSingleProject(projectId) {
  try {
    // Fetch the project with its project manager ID
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { projectManagerId: true },
    });

    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    const developers = await prisma.projectPerson.findMany({
      where: {
        projectId,
        personId: {
          not: project.projectManagerId, // Exclude the project manager
        },
      },
      select: {
        personId: true,
        Person: {
          select: { name: true },
        },
      },
    });

    // Transform the data
    return developers.map((developer) => ({
      id: developer.personId,
      name: developer.Person.name,
    }));
  } catch (error) {
    console.error("Error fetching developers of project:", error);
    throw error;
  }
};

module.exports.getDeveloperIdsInProject = async function getDeveloperIdsInProject(projectId) {
  try {
    const developers = await prisma.projectPerson.findMany({
      where: {
        projectId: projectId,
      },
      select: {
        personId: true,
      },
    });

    return developers.map(developer => developer.personId);
  } catch (error) {
    console.error("Error fetching developer IDs for project:", error);
    throw error;
  }
};

module.exports.getUnassignedDevelopersInProject = async function getUnassignedDevelopersInProject(taskId, projectId) {
  try {
    // Fetch the project with its project manager ID
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { projectManagerId: true },
    });
    // Fetch the list of person IDs for the given task
    const persons = await prisma.taskAssignment.findMany({
      where: { taskId: taskId },
      select: { personId: true },
    });

    // Extract person IDs into an array or set it to an empty array if none found
    let personIds = persons && persons.length > 0 
    ? persons.map((person) => person.personId) 
    : [];

    // Always exclude the project manager
    if (project.projectManagerId) {
    personIds.push(project.projectManagerId);
    }

    // Fetch developers in the project, excluding the IDs from `persons`
    const developers = await prisma.projectPerson.findMany({
      where: {
        projectId,
        personId: {
          notIn: personIds, // Exclude persons already assigned to the task
        },
      },
      select: {
        personId: true,
        Person: {
          select: { name: true },
        },
      },
    });

    // Transform the data
    return developers.map((developer) => ({
      id: developer.personId,
      name: developer.Person.name,
    }));
  } catch (error) {
    console.error("Error fetching developers to remove:", error);
    throw error;
  }
};
// Function to get all dates between start and end
const getDatesBetween = (startDate, endDate) => {
  const dates = [];
  const differenceInDays = Math.ceil(
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
  );

  const interval = differenceInDays > 30 ? Math.ceil(differenceInDays / 30) : 1; // Adjust interval for long durations
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate).toISOString().split("T")[0]); // Format as YYYY-MM-DD
    currentDate.setDate(currentDate.getDate() + interval); // Increment by interval days
  }

  return dates;
};

module.exports.getProjectById = async function getProjectById(projectId) {
  try {
    return await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        projectManagerId: true,
      },
    });
  } catch (error) {
    console.error("Error retrieving project by ID:", error);
    throw error;
  }
};
module.exports.getProjectDetails = async function getProjectDetails(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      projectManagerId: true,
      createdAt: true,
      deadline: true,
      Person: {
        select: { name: true }, // Project manager details
      },
      ProjectPerson: {
        select: {
          Person: { select: { id: true, name: true } }, // Developers' details
          personId: true,
        },
      },
      Task: {
        select: { id: true, status: true, createdAt: true, completedAt: true },
      },
    },
  });

  if (!project) {
    console.error("Project not found");
    return null;
  }

  const developers = project.ProjectPerson.filter(
    (person) => person.personId !== project.projectManagerId
  );

  const developersDetail = await Promise.all(
    developers.map(async (developer) => {
      const taskAssignments = await prisma.taskAssignment.findMany({
        where: {
          task: { projectId: projectId },
          personId: developer.personId,
        },
        include: {
          task: { select: { status: true } },
        },
      });

      const taskCountsByStatus = taskAssignments.reduce(
        (counts, assignment) => {
          const status = assignment.task.status;
          counts[status] = (counts[status] || 0) + 1;
          return counts;
        },
        {}
      );

      return {
        id: developer.Person.id,
        name: developer.Person.name,
        taskCountsByStatus,
      };
    })
  );

  const totalTasks = project.Task.length;

  const statusCounts = project.Task.reduce((counts, task) => {
    counts[task.status] = (counts[task.status] || 0) + 1;
    return counts;
  }, {});

  // Generate timeline from project createdAt to deadline
  const timeline = eachDayOfInterval({
    start: new Date(project.createdAt),
    end: new Date(project.deadline),
  }).map((date) => ({
    date: format(date, "yyyy-MM-dd"),
    COMPLETED: 0,
    IN_PROGRESS: 0,
    PENDING: 0,
    ON_HOLD: 0,
  }));

  // Populate task counts by status for each date
  for (const task of project.Task) {
    for (const entry of timeline) {
      const taskCreated = new Date(task.createdAt) <= new Date(entry.date);
      const taskCompleted =
        task.completedAt && new Date(task.completedAt) <= new Date(entry.date);

      if (taskCreated) {
        entry[task.status] += 1;
      }
    }
  }

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    projectManager: project.Person.name,
    createdAt: project.createdAt,
    deadline: project.deadline,
    developersDetail: {
      numDevelopers: developers.length,
      developers: developersDetail,
    },
    tasksDetails: {
      totalTasks,
      statusCounts,
      timeline
    },
  };
};


module.exports.getProjectsByManager = async function getProjectsByManager(
  personId
) {
  return prisma.project.findMany({
    where: {
      projectManagerId: personId, // Fetch projects where the person is the manager
    },
    select: {
      id: true,
      name: true,
      description: true
    },
    orderBy: {
      id: 'asc', // Order by id in ascending order
    },
  });
};

module.exports.getProjectsByDeveloper = async function getProjectsByDeveloper(
  personId
) {
  return prisma.project.findMany({
    where: {
      ProjectPerson: {
        some: {
          personId: personId, // Fetch projects where the person is assigned
        },
      },
      NOT: {
        projectManagerId: personId, // Exclude projects where the person is the manager
      },
    },
    select: {
      id: true,
      name: true,
      projectManagerId: true,
    },
    orderBy: {
      id: 'asc', // Order by id in ascending order
    },
  });
};

module.exports.createProjectAsManager = async function (
  personId,
  projectName,
  projectDescription,
  deadline,
  developerIds = []
) {

  const person = await prisma.Person.findFirst({
    select: { teamId: true },
    where: { id: personId }
  });
  
  const teamId = person?.teamId ?? null; // Handle case when person is null
  

  const projectData = {
    name: projectName,
    description: projectDescription,
    projectManagerId: parseInt(personId, 10), // Ensure personId is an integer
    teamId: parseInt(teamId, 10), // Ensure teamId is an integer
    deadline: deadline ? new Date(deadline) : null, // Convert deadline to Date if provided
  };

  try {
    const result = await prisma.$transaction(async (prisma) => {
      // Create the project
      const project = await prisma.project.create({
        data: projectData,
      });

      // Add the manager to the ProjectPerson table
      await prisma.projectPerson.create({
        data: {
          projectId: project.id,
          personId: parseInt(personId, 10),
        },
      });

      // Add developers if provided
      if (developerIds.length > 0) {
        const developerEntries = developerIds.map((developerId) => ({
          projectId: project.id,
          personId: parseInt(developerId, 10),
        }));
        await prisma.projectPerson.createMany({ data: developerEntries });
      }

      return project;
    });

    return result;
  } catch (error) {
    console.error("Error in createProjectAsManager:", error);
    throw error;
  }
};


module.exports.addNewDeveloperForSingleProject =
  async function addNewDeveloperForSingleProject(
    personId,
    projectId,
    developerIds
  ) {
    try {
      // Validate input
      if (!Array.isArray(developerIds) || developerIds.length === 0) {
        throw new Error("No developers provided to add.");
      }

      // Fetch the project and validate project manager
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { projectManagerId: true },
      });

      if (!project) {
        throw new Error(`Project with ID ${projectId} not found.`);
      }

      if (project.projectManagerId !== parseInt(personId, 10)) {
        throw new Error("You are not authorized to modify this project.");
      }

      // Prepare data for bulk insert
      const developerEntries = developerIds.map((developerId) => ({
        projectId,
        personId: parseInt(developerId, 10),
      }));

      // Add developers to the project
      const result = await prisma.projectPerson.createMany({
        data: developerEntries,
      });

      return { message: `${result.count} developers added successfully.` };
    } catch (error) {
      console.error("Error in addNewDeveloperForSingleProject:", error);
      throw error;
    }
  };

module.exports.updateSingleProject = async function updateSingleProject(
  personId,
  projectId,
  projectName,
  projectDescription
) {
  try {
    // Fetch the project to ensure the person is the project manager
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { projectManagerId: true },
    });

    if (!project) {
      console.error("Project not found");
      return null;
    }

    // Check if the person requesting the update is the project manager
    if (project.projectManagerId !== personId) {
      console.error("User is not authorized to update this project");
      return null;
    }

    // Update the project details
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: projectName,
        description: projectDescription,
      },
    });
    return updatedProject;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

module.exports.transferPeronInSingleProject =
  async function transferPeronInSingleProject(
    projectManagerId,
    projectId,
    transferringId,
    transferredId
  ) {
    try {
      return await prisma.$transaction(async (prisma) => {
        // Verify project manager access
        const [project, isPersonInProject] = await Promise.all([
          prisma.project.findUnique({
            where: { id: projectId },
            select: { projectManagerId: true },
          }),
          prisma.projectPerson.findUnique({
            where: {
              projectId_personId: { projectId, personId: transferredId },
            },
          }),
        ]);

        if (!project) {
          throw new Error("Project not found.");
        }

        if (project.projectManagerId !== projectManagerId) {
          throw new Error("You are not authorized to modify this project.");
        }

        if (!isPersonInProject) {
          throw new Error(
            "Cannot transfer tasks to a person who is not part of the project."
          );
        }

        // Check if transferring person has tasks
        const tasksToTransfer = await prisma.taskAssignment.findMany({
          where: { personId: transferringId },
        });

        if (tasksToTransfer.length === 0) {
          return {
            message: `The person you are trying to transfer tasks from has no tasks assigned.`,
          };
        }

        // Get task IDs and check for duplicates
        const taskIds = tasksToTransfer.map((task) => task.taskId);

        const existingAssignments = await prisma.taskAssignment.findMany({
          where: {
            personId: transferredId,
            taskId: { in: taskIds },
          },
        });

        const existingTaskIds = new Set(
          existingAssignments.map((assignment) => assignment.taskId)
        );

        // Filter out tasks that would cause duplicate assignments
        const tasksToUpdate = tasksToTransfer.filter(
          (task) => !existingTaskIds.has(task.taskId)
        );

        // Batch update for tasks that can be reassigned
        if (tasksToUpdate.length > 0) {
          await prisma.taskAssignment.updateMany({
            where: { id: { in: tasksToUpdate.map((task) => task.id) } },
            data: { personId: transferredId },
          });
        }

        // Delete old task assignments for tasks already assigned to transferredId
        const tasksToDelete = tasksToTransfer.filter((task) =>
          existingTaskIds.has(task.taskId)
        );

        if (tasksToDelete.length > 0) {
          await prisma.taskAssignment.deleteMany({
            where: { id: { in: tasksToDelete.map((task) => task.id) } },
          });
        }

        return {
          message: `Person transferred successfully. Total tasks reassigned: ${tasksToUpdate.length}, tasks resolved for duplicates: ${tasksToDelete.length}.`,
        };
      });
    } catch (error) {
      console.error("Error in transferPeronInSingleProject:", error);
      throw error;
    }
  };



module.exports.deleteSingleProject = async function deleteSingleProject(
  personId,
  projectId
) {
  try {
    // Fetch the project to check ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { projectManagerId: true },
    });

    if (!project) {
      console.error("Project not found");
      return null;
    }

    // Ensure the person requesting deletion is the project manager
    if (project.projectManagerId !== personId) {
      console.error("User is not authorized to delete this project");
      return null;
    }

    // Delete related data (e.g., ProjectPerson, Task, Notifications, etc.)
    await prisma.$transaction(async (prisma) => {
      // Delete all notification recipients for the project's notifications
      await prisma.notificationRecipient.deleteMany({
        where: {
          notification: {
            projectId: projectId,
          },
        },
      });

      // Delete all notifications associated with the project
      await prisma.notification.deleteMany({
        where: { projectId: projectId },
      });

      // Delete all tasks assigned to the project
      await prisma.task.deleteMany({
        where: { projectId: projectId },
      });

      // Delete all entries in the ProjectPerson table related to the project
      await prisma.projectPerson.deleteMany({
        where: { projectId: projectId },
      });

      // Delete the project itself
      await prisma.project.delete({
        where: { id: projectId },
      });
    });
    return { message: "Project deleted successfully" };
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

module.exports.deletePersonInSingleProject =
  async function deletePersonInSingleProject(
    projectManagerId,
    projectId,
    removedPersonId
  ) {
    try {
      // Begin transaction
      await prisma.$transaction(async (prisma) => {
        // Verify project manager access
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { projectManagerId: true },
        });

        if (!project) {
          throw new Error("Project not found.");
        }

        if (project.projectManagerId !== projectManagerId) {
          throw new Error("You are not authorized to modify this project.");
        }

        // Delete all tasks associated with the person in the project
        await prisma.task.deleteMany({
          where: {
            persons: {
              some: {
                personId: removedPersonId,
              },
            },
            projectId: projectId,
          },
        });

        // Remove the person from the project
        await prisma.projectPerson.delete({
          where: {
            projectId_personId: { projectId, personId: removedPersonId },
          },
        });
      });

      return {
        message:
          "Person and their tasks removed successfully from the project.",
      };
    } catch (error) {
      console.error("Error in deletePersonInSingleProject:", error);

      if (error.code === "P2025") {
        throw new Error("Record to delete does not exist.");
      }

      if (error.code === "P2028") {
        throw new Error(
          "Transaction already closed. Ensure all operations are awaited properly."
        );
      }

      throw error;
    }
  };

  module.exports.getProjectDeadlines= async function getProjectDeadlines(personId) {
    const deadlines = await prisma.project.findMany({
      where: {
        ProjectPerson: {
          some: {
            personId: personId,
          },
        },
        deadline: {
          not: null,
        },
      },
      distinct: ['deadline'], // Select distinct deadlines
      orderBy: {
        deadline: 'asc', // Sort by deadline
      },
      select: {
        deadline: true,
        name: true,
      },
    });
  
    return deadlines.map((project) => ({
      deadline: project.deadline,
      name: project.name,
    }));
  };

  module.exports.getDeveloperWorkLoad = async function getDeveloperWorkLoad(projectId) {
    try {
      // Get the project manager's ID
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { projectManagerId: true }
      });
  
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
  
      const projectManagerId = project.projectManagerId;
  
      // Get developers assigned to the project
      const developers = await prisma.projectPerson.findMany({
        where: {
          projectId,
          personId: { not: projectManagerId } // Exclude the project manager
        },
        select: {
          personId: true,
          Person: {
            select: { name: true }
          }
        }
      });
  
      // Fetch task counts separately for each developer
      const developerIds = developers.map(dev => dev.personId);
  
      const taskCounts = await prisma.taskAssignment.groupBy({
        by: ["personId"],
        where: {
          personId: { in: developerIds },
          task: { projectId }
        },
        _count: {
          personId: true
        }
      });
  
      // Convert taskCounts into a lookup object
      const taskCountMap = taskCounts.reduce((acc, curr) => {
        acc[curr.personId] = curr._count.personId;
        return acc;
      }, {});
  
      // Format response
      return developers.map(dev => ({
        personId: dev.personId,
        name: dev.Person.name,
        taskCount: taskCountMap[dev.personId] || 0 // Default to 0 if no tasks
      }));
    } catch (error) {
      console.error('Error fetching developer workload:', error);
      throw error;
    }
  };
  
