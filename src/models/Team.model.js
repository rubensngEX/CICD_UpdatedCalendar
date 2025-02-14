const prisma = require("../models/prismaClient");

// Function to generate a random team code
function generateTeamCode() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";

  let alphaPart = "";
  let numPart = "";

  // Generate 8 random letters
  for (let i = 0; i < 8; i++) {
    alphaPart += letters[Math.floor(Math.random() * letters.length)];
  }

  // Generate 4 random numbers
  for (let i = 0; i < 4; i++) {
    numPart += numbers[Math.floor(Math.random() * numbers.length)];
  }

  // Merge and shuffle
  const combined = (alphaPart + numPart).split("").sort(() => Math.random() - 0.5).join("");

  return combined;
}

// Create a new team with a generated team code
module.exports.createTeam = async function (teamName, personId) {
  try {
    const teamCode = generateTeamCode(); // Generate unique team code

    const team = await prisma.team.create({
      data: {
        name: teamName,
        teamCode: teamCode // Ensure the column name matches your Prisma schema
      }
    });

    // Update the user's teamId
    await prisma.person.update({
      where: { id: parseInt(personId, 10) },
      data: { teamId: team.id }
    });

    console.log(`Team created: ${team.name} (Code: ${team.teamCode})`);

    return team;
  } catch (error) {
    console.error("Error creating team:", error);
    throw new Error("Failed to create team.");
  }
};

// Fetch all teams
module.exports.getAllTeams = async function () {
  try {
    return await prisma.team.findMany({
      select: { id: true, name: true, code: true }
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    throw new Error("Failed to fetch teams.");
  }
};

module.exports.getTeamById = async function (teamId) {
  try {
    console.log(`Fetching team with ID: ${teamId}`);

    const team = await prisma.team.findUnique({
      where: { id: parseInt(teamId, 10) },
      select: { id: true, name: true, teamCode: true }
    });

    if (!team) {
      console.error("No team found with that ID");
      throw new Error("Invalid team ID.");
    }

    console.log("Team fetched:", team);
    return team;
  } catch (error) {
    console.error("Error fetching team:", error);
    throw new Error("Failed to fetch team.");
  }
};

// Join a team by code
module.exports.joinTeamByCode = async function (personId, teamCode) {
  try {
    console.log(`Searching for team with code: ${teamCode}`);

    const team = await prisma.team.findUnique({
      where: { teamCode: teamCode }
    });

    if (!team) {
      console.error("No team found with that code");
      throw new Error("Invalid team code.");
    }

    console.log(`Found team: ${team.id}, adding person ${personId}`);

    const updatedPerson = await prisma.person.update({
      where: { id: personId },
      data: { teamId: team.id }
    });

    console.log("Updated person record:", updatedPerson);
    return updatedPerson;
  } catch (error) {
    console.error("Error joining team:", error);
    throw new Error("Failed to join team.");
  }
};

module.exports.getTeamPersons = async function (personId) {
  try {
    console.log(`Fetching team persons for person ID: ${personId}`);

    // Fetch the user's teamId
    const person = await prisma.person.findUnique({
      where: { id: personId },
      select: { teamId: true },
    });

    console.log("Fetched person:", person);

    if (!person || !person.teamId) {
      console.error("User is not part of any team or team ID is missing.");
      throw new Error("User is not part of any team.");
    }
    console.log(person.teamId, " at 133 model");
    // Fetch all persons in the same team
    const persons = await prisma.person.findMany({
      where: { teamId: person.teamId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true, // Assuming avatar is a field in your person model
      },
    });

    console.log("Fetched team persons:", persons);
    return persons;
  } catch (error) {
    console.error("Error fetching team persons:", error.message);
    throw new Error("Failed to fetch team persons.");
  }
};

module.exports.requestToJoinTeam = async function (personId, teamCode) {
  try {
    console.log(`Searching for team with code: ${teamCode}`);

    const team = await prisma.team.findUnique({
      where: { teamCode }
    });

    if (!team) {
      console.error("No team found with that code");
      throw new Error("Invalid team code.");
    }

    console.log(`Found team: ${team.id}, checking for existing request from person ${personId}`);

    // Check if the user already has a pending request
    const existingRequest = await prisma.teamRequest.findFirst({
      where: { teamId: team.id, personId }
    });

    if (existingRequest) {
      throw new Error("You have already requested to join this team.");
    }

    // Insert a join request in `TeamRequest` table
    await prisma.teamRequest.create({
      data: {
        teamId: team.id,
        personId
      }
    });

    console.log("Join request created successfully.");
    return { message: "Join request submitted successfully." };
  } catch (error) {
    console.error("Error processing join request:", error);
    throw new Error("Failed to request to join team.");
  }
};

module.exports.getPendingRequests = async function (personId) {
  try {
      const pendingRequests = await prisma.teamRequest.findMany({
          where: { personId },
          include: {
              Team: {
                  select: { name: true }
              }
          }
      });

      if (!pendingRequests || pendingRequests.length === 0) {
          return [];
      }

      // Ensure `team` exists before accessing `.name`
      return pendingRequests
          .filter(request => request.team) // Prevents "undefined" errors
          .map(request => ({
              teamName: request.team.name
          }));
  } catch (error) {
      console.error("Error fetching pending requests:", error);
      throw new Error("Failed to fetch pending requests.");
  }
};

// Fetch pending requests for a specific team
module.exports.getTeamRequests = async function (teamId) {
  try {
      const requests = await prisma.teamRequest.findMany({
          where: { teamId },
          include: {
              person: { // ✅ Ensure `person` is included properly
                  select: { id: true, name: true, email: true }
              }
          }
      });

      if (!requests || requests.length === 0) {
          return [];
      }

      return requests.map(request => ({
          requestId: request.id,
          personId: request.person?.id || null, // ✅ Ensure safe access
          personName: request.person?.name || "Unknown",
          personEmail: request.person?.email || "No Email"
      }));
  } catch (error) {
      console.error("Error fetching team requests:", error);
      throw new Error("Failed to fetch team requests.");
  }
};

// Accept a request (assign person to team & remove request)
module.exports.acceptTeamRequest = async function (requestId) {
  try {
      const request = await prisma.teamRequest.findUnique({
          where: { id: requestId },
          include: { team: true, person: true }
      });

      if (!request) {
          throw new Error("Request not found.");
      }

      // Update the person’s teamId
      await prisma.person.update({
          where: { id: request.personId },
          data: { teamId: request.teamId }
      });

      // Remove the request from TeamRequest table
      await prisma.teamRequest.delete({
          where: { id: requestId }
      });

      return { message: "Request accepted successfully" };
  } catch (error) {
      console.error("Error accepting request:", error);
      throw new Error("Failed to accept team request.");
  }
};

// Reject a request (simply remove it from TeamRequest table)
module.exports.rejectTeamRequest = async function (requestId) {
  try {
      await prisma.teamRequest.delete({
          where: { id: requestId }
      });

      return { message: "Request rejected successfully" };
  } catch (error) {
      console.error("Error rejecting request:", error);
      throw new Error("Failed to reject team request.");
  }

}



//       if (!request) {
//           throw new Error("Request not found.");
//       }

//       // Update the person’s teamId
//       await prisma.person.update({
//           where: { id: request.personId },
//           data: { teamId: request.teamId }
//       });

//       // Remove the request from TeamRequest table
//       await prisma.teamRequest.delete({
//           where: { id: requestId }
//       });

//       return { message: "Request accepted successfully" };
//   } catch (error) {
//       console.error("Error accepting request:", error);
//       throw new Error("Failed to accept team request.");
//   }
// };

// Reject a request (simply remove it from TeamRequest table)
module.exports.rejectTeamRequest = async function (requestId) {
  try {
      await prisma.teamRequest.delete({
          where: { id: requestId }
      });

      return { message: "Request rejected successfully" };
  } catch (error) {
      console.error("Error rejecting request:", error);
      throw new Error("Failed to reject team request.");
  }
};

module.exports.getProjectsByTeamId = async function (teamId) {
  try {
    // console.log(Fetching projects for team ID: ${teamId}, "at model ");

    // Querying the projects using Prisma
    const projects = await prisma.$queryRaw`
      SELECT 
          p."id" AS project_id,
          p."name" AS project_name,
          p."description",
          m."name" AS project_manager,
          m."email" AS managerEmail,
          m."id" AS manager_id,
          p."createdAt",
          p."deadline",
          COALESCE(COUNT(CASE WHEN t."status" = 'PENDING' THEN 1 END)::INTEGER, 0) AS pending_count,
          COALESCE(COUNT(CASE WHEN t."status" = 'IN_PROGRESS' THEN 1 END)::INTEGER, 0) AS in_progress_count,
          COALESCE(COUNT(CASE WHEN t."status" = 'COMPLETED' THEN 1 END)::INTEGER, 0) AS completed_count,
          COALESCE(COUNT(CASE WHEN t."status" = 'ON_HOLD' THEN 1 END)::INTEGER, 0) AS on_hold_count
      FROM "Project" p
      JOIN "Person" m ON m."id" = p."projectManagerId"
      LEFT JOIN "Task" t ON t."projectId" = p."id"
      WHERE p."teamId" = ${teamId}
      GROUP BY p."id", p."name",  p."description", m."name", m."email", m."id", p."createdAt", p."deadline"
      ORDER BY p."id";`;


    // Handle case when no projects are found
    if (!projects || projects.length === 0) {
      console.error("No projects found for that team ID");
      throw new Error("Invalid team ID or no projects available.");
    }

  


    // Return the formatted projects
    return projects;

  } catch (error) {
    console.error("Error fetching projects:", error);
    throw new Error("Failed to fetch projects.");
  }
};

module.exports.getMyJoinRequests = async function getMyJoinRequests(personId) {
  try {
    // console.log(Fetching join requests for person ID: ${personId});

    const requests = await prisma.projectRequest.findMany({
      where: {
        personId: parseInt(personId, 10), // ✅ Filter by personId (your ID)
      },
      select: {
        id: true,
        person: { select: { id: true, name: true, email: true } }, 
        project: { select: { id: true, name: true } }, 
        approve: true
      },
    });

    console.log("Filtered requests fetched successfully:", requests);
    return requests;
  } catch (error) {
    console.error("Error fetching join requests:", error);
    throw new Error("Failed to retrieve your join requests.");
  }
};

module.exports.requestJoinProject = async function requestJoinProject(personId, projectId) {
  try {

    const existingRequest = await prisma.ProjectRequest.findUnique({
      where: { personId_projectId: { personId, projectId } },
    });
    
    if (existingRequest) {
      throw new Error("You have already requested to join this project.");
    }
    
    const joinRequest = await prisma.ProjectRequest.create({
      data: {
        personId,
        projectId,
        approve: null,
      },
    });

    console.log("Join request created successfully:", joinRequest); // ✅ Log success
    return joinRequest;
  } catch (error) {
    console.error("Error creating join request:", error); // ❌ Log actual error
    throw new Error("Failed to send project join request: " + error.message);
  }
};

module.exports.updateJoinRequestApproval =
  async function updateJoinRequestApproval(
    projectId,
    requesterId,
    approvalStatus
  ) {
    try {
      // console.log(`Updating join request ID: ${requestId} to ${approvalStatus}`);
      const request = await prisma.projectRequest.findUnique({
        where: { personId_projectId: { personId: requesterId, projectId } },
      });
      if (!request) {
        throw new Error("Join request not found.");
      }
      console.log(`🚀 ~ updateJoinRequestApproval ~ request:`, request);
      const updatedRequest = await prisma.projectRequest.update({
        where: { id: request.id },
        data: { approve: approvalStatus },
      });

      console.log("Join request updated successfully:", updatedRequest);
      return updatedRequest;
    } catch (error) {
      console.error("Error updating join request:", error);
      throw new Error("Failed to update project join request.");
    }
  };