const prisma = require("./prismaClient");

module.exports.createNoti = async (projectId, taskId, type, message, recipientIds = [], requesterId = null) => {
  try {
    //  If projectId is provided, verify the project exists
    if (projectId !== null) {
      const projectExists = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!projectExists) {
        throw new Error(`Project with ID ${projectId} does not exist.`);
      }
    }


    // Step 2: Create the message (announcement or notification)
    const createdMessage = await prisma.notification.create({
      data: {
        projectId: projectId,
        taskId: taskId,
        type: type, // "ANNOUNCEMENT" or "REQUEST" or "TASK"
        message: message,
        recipients: {
          create: recipientIds.map((recipientId) => ({
            personId: parseInt(recipientId, 10), // Ensure recipientId is an integer
          })),
        },
        requesterId: requesterId ? parseInt(requesterId, 10) : null, // Ensure requesterId is an integer
      }
    });

    console.log(`${type} Created:`, createdMessage);
    return createdMessage;
  } catch (error) {
    console.error(`Error creating ${type}:`, error);
    throw error;
  }
};


module.exports.getDeveloperNoti = async function getDeveloperNoti(personId) {
  try {
    return await prisma.notificationRecipient.findMany({
      where: {
      personId: personId,
      },
      select: {
      id: true,
      isRead: true,
      Notification: {
        select: {
        type: true,
        message: true, // Include the notification message
        projectId: true,
        taskId: true,
        requesterId: true,
        createdAt: true, // Include notification creation date
        },
      },
      },
    });
  } catch (error) {
    console.error("Error fetching notifications for developer:", error);
    throw error;
  }
};

module.exports.ReadTrue = async function ReadTrue(id) {
  try {
    const updatedNotification = await prisma.notificationRecipient.update({
      where: {
          id: id, // ID of the notification to update
      },
      data: {
          isRead: true, // Set isRead to true
      },
  });
  return updatedNotification;
  } catch (error) {
    console.error("Error fetching notifications for developer:", error);
    throw error;
  }
};
