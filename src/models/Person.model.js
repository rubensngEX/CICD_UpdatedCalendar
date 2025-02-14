const {
  hashPasswordWithParameters,
  comparePasswordWithParameters,
} = require("../middleware/argonMiddleware");

const prisma = require("./prismaClient");

// Get all persons
module.exports.getAllPersons = async function getAllPersons() {
  return prisma.person.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  });
};

// Get person by ID
module.exports.getPersonsById = async function getPersonsById(personId) {
  try {
    return await prisma.person.findUnique({
      where: { id: personId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        teamId: true,
      },
    });
  } catch (error) {
    console.error("Error retrieving person by ID:", error);
    throw error;
  }
};
// Update person avatar
module.exports.updatePersonAvatar = async function updatePersonAvatar(personId, avatarUrl) {
  try {
    return await prisma.person.update({
      where: { id: personId },
      data: { avatar: avatarUrl },
    });
  } catch (error) {
    console.error("Error updating avatar:", error);
    throw error;
  }
};


// Update person details
module.exports.updatePersonDetails = async function updatePersonDetails(
  personId,
  updateData
) {
  try {
    return await prisma.person.update({
      where: { id: personId },
      data: updateData,
    });
  } catch (error) {
    console.error("Error updating person details:", error);
    throw error;
  }
};

// Update person password
module.exports.updatePersonPassword = async function updatePersonPassword(
  personId,
  oldPassword,
  newPassword
) {
  try {
    // Retrieve the person's current hashed password
    const person = await prisma.person.findUnique({
      where: { id: personId },
      select: { password: true },
    });

    if (!person) {
      throw new Error("Person not found.");
    }

    // Validate old password
    await comparePasswordWithParameters(oldPassword, person.password);

    // Hash the new password
    const hashedPassword = await hashPasswordWithParameters(newPassword);

    // Update the password in the database
    await prisma.person.update({
      where: { id: personId },
      data: { password: hashedPassword },
    });

    return { message: "Password updated successfully with middleware." };
  } catch (error) {
    console.error("Error updating password with middleware:", error);
    throw error;
  }
};

// Delete person account
module.exports.deletePersonAccount = async function deletePersonAccount(
  personId
) {
  try {
    await prisma.person.delete({
      where: { id: personId },
    });
    return { message: "Account deleted successfully." };
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
};

// Get all persons in a specific project
module.exports.getAllPersonsInTheProject =
  async function getAllPersonsInTheProject(projectId) {
    try {
      const persons = await prisma.projectPerson.findMany({
        where: {
          projectId: projectId,
        },
        select: {
          Person: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      return persons.map((entry) => entry.Person);
    } catch (error) {
      console.error("Error retrieving persons by project ID:", error);
      throw error;
    }
  };

// Get developer and manager IDs for a specific project
module.exports.getDevIdAndManId = async function getDevIdAndManId(
  projectId,
  personId
) {
  try {
    const result = await prisma.projectPerson.findMany({
      where: {
        projectId: projectId,
        personId: personId,
      },
      select: {
        personId: true,
        Project: {
          select: {
            projectManagerId: true,
          },
        },
      },
    });

    return result;
  } catch (error) {
    console.error("Error retrieving developer and manager IDs:", error);
    throw error;
  }
};

// Retrieve person by username
module.exports.retrieveByUsername = async function retrieveByUsername(
  username
) {
  try {
    const person = await prisma.person.findUnique({
      where: { name: username },
    });
    return person;
  } catch (error) {
    console.error("Error retrieving person by username:", error);
    throw error;
  }
};

// Retrieve person by email
module.exports.retrieveByEmail = async function retrieveByEmail(email) {
  try {
    const person = await prisma.person.findUnique({
      where: { email: email },
    });
    return person;
  } catch (error) {
    console.error("Error retrieving person by email:", error);
    throw error;
  }
};

module.exports.findPersonByGoogleId = async (googleId) => {
  return await prisma.person.findUnique({ where: { googleId } });
};

// ✅ Find Person by Email
module.exports.findPersonByEmail = async (email) => {
  return await prisma.person.findUnique({ where: { email } });
};

// ✅ Find Person by ID
module.exports.getPersonByGId = async (gId) => {
  return await prisma.person.findUnique({
    where: { googleId: gId },
    select: { id: true, name: true, email: true, avatar: true }
  });
};

// ✅ Create New Person (Google Sign-In)
module.exports.createPerson = async (googleId, email, name, password) => {
  return await prisma.person.create({
    data: { googleId, email, name, password}
  });
};