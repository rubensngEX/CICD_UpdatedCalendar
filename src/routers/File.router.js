const express = require("express");
const router = express.Router();
const fileModel = require("../models/File.model");
const logger = require("../services/logger");
const { uploadFile, updateFile, deleteFile } = require('../middleware/cloudinaryMiddleware');
const jwtMiddleware = require('../middleware/jwtMiddleware');


// Get file by ID with error handling
router.get("/:id", jwtMiddleware.verifyToken, async (req, res, next) => {
  try {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid file ID"
      });
    }

    const file = await fileModel.getFileById(fileId);
    if (!file) {
      return res.status(404).json({
        status: "error",
        message: "File not found"
      });
    }
    res.status(200).json({
      status: "success",
      data: file
    });
  } catch (error) {
    logger.error(error, "Error getting file by ID");
    next(error);
  }
});

// Get files by project ID
router.get("/getByProject/:projectId", jwtMiddleware.verifyToken, async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid project ID"
      });
    }

    const files = await fileModel.getFilesByProject(projectId);
    res.status(200).json({
      status: "success",
      data: files
    });
  } catch (error) {
    logger.error(error, "Error getting files by project");
    next(error);
  }
});

// Upload file with validation
router.post("/upload", jwtMiddleware.verifyToken, uploadFile, async (req, res, next) => {
  try {
    if (!req.fileInfo) {
      return res.status(400).json({
        status: "error",
        message: "File upload failed"
      });
    }

    const uploadedFile = await fileModel.createFile({
      ...req.fileInfo,
      uploadedBy: res.locals.personId
    });

    res.status(201).json({
      status: "success",
      message: "File uploaded successfully",
      data: uploadedFile
    });
  } catch (error) {
    logger.error(error, "Error uploading file");
    next(error);
  }
});

// Delete file with cleanup
router.delete("/:id", jwtMiddleware.verifyToken, async (req, res, next) => {
  try {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid file ID"
      });
    }

    // Check if user has permission to delete the file
    const existingFile = await fileModel.getFileById(fileId);
    if (!existingFile) {
      return res.status(404).json({
        status: "error",
        message: "File not found"
      });
    }

    if (existingFile.uploadedBy !== res.locals.personId) {
      return res.status(403).json({
        status: "error",
        message: "You don't have permission to delete this file"
      });
    }

    // Delete from database first
    await fileModel.deleteFile(fileId);
    
    // Then delete from Cloudinary using the middleware
    if (existingFile.publicId) {
      await deleteFile(fileId);
    }

    res.status(200).json({
      status: "success",
      message: "File deleted successfully"
    });
  } catch (error) {
    logger.error(error, "Error deleting file");
    next(error);
  }
});

module.exports = router;
