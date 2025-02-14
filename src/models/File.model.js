const prisma = require("./prismaClient");
// Get file by ID
module.exports.getFileById = async function(fileId) {
  try {
    return await prisma.file.findUnique({
      where: { id: parseInt(fileId) },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          } 
        }
      }
    });
  } catch (error) {
    console.error("Error getting file by ID:", error);
    throw error;
  }
};


// Get files by project ID
module.exports.getFilesByProject = async function(projectId) {
  try {
    return await prisma.file.findMany({
      where: { projectId: parseInt(projectId) },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  } catch (error) {
    console.error("Error getting files by project:", error);
    throw error;
  }
};

// Create file
module.exports.createFile = async function(fileData) {
  try {
    return await prisma.file.create({
      data: {
        name: fileData.originalName,
        url: fileData.url,
        size: fileData.size,
        type: fileData.type,
        projectId: fileData.projectId,
        uploadedBy: fileData.uploadedBy
      }   
    });
  } catch (error) {
    console.error("Error creating file:", error);
    throw error;
  }
};

// Delete file
module.exports.deleteFile = async function(fileId) {
  try {
    return await prisma.file.delete({
      where: { id: fileId }
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};
