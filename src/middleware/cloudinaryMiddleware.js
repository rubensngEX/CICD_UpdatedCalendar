const formidable = require("formidable");
const cloudinary = require("cloudinary").v2;
const prisma = require("../models/prismaClient");
require("dotenv").config();

// Configure Cloudinary

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Avatar upload middleware using Formidable
const uploadAvatar = async (req, res, next) => {
  const form = new formidable.IncomingForm();

  // Parse incoming form-data
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "Failed to process the form." });
    }

    // Check if avatar file is provided
    if (!files.avatar) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const personId = res.locals.personId; 
    const filePath = files.avatar[0].filepath;

    try {
      // Retrieve user's current avatar from the database
      const person = await prisma.person.findUnique({
        where: { id: personId },
        select: { avatar: true },
      });

      const oldAvatarUrl = person?.avatar;

      // Upload new avatar to Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        folder: process.env.CLOUDINARY_FOLDER,
        transformation: [{ width: 200, height: 200, crop: "limit", quality: "auto" }],
      });

      // Attach new avatar URL to request
      req.avatarUrl = result.secure_url;

      // Delete old avatar from Cloudinary if it exists and is not the default avatar
      if (oldAvatarUrl && !oldAvatarUrl.includes("default-avatar")) {
        const oldPublicId = oldAvatarUrl.split("/").pop().split(".")[0]; // Extract public ID
        await cloudinary.uploader.destroy(`${process.env.CLOUDINARY_FOLDER}/${oldPublicId}`);
        console.log("Old avatar deleted:", oldPublicId);
      }

      // Continue to next middleware
      next();
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      res.status(500).json({ error: "Failed to upload image to Cloudinary." });
    }
  });
};

// Upload file middleware
const uploadFile = (req, res, next) => {
  const form = new formidable.IncomingForm({
    multiples: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB limit
    filter: function ({ name, originalFilename, mimetype }) {
      // Add file type validation
      const allowedTypes = [
        "image/",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      return allowedTypes.some((type) => mimetype?.startsWith(type));
    },
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(400).json({ 
        status: "error",
        message: err.message || "Failed to process the form." 
      });
    }

    // Check if file exists
    const file = files.file?.[0] || files.file;
    if (!file) {
      return res.status(400).json({ 
        status: "error",
        message: "No file uploaded." 
      });
    }

    try {
      // Get projectId from fields
      const projectId = fields.projectId?.[0] || fields.projectId;
      if (!projectId) {
        return res.status(400).json({ 
          status: "error",
          message: "Project ID is required" 
        });
      }

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(file.filepath, {
        folder: process.env.CLOUDINARY_FOLDER,
        resource_type: "auto",
        public_id: `${Date.now()}-${file.originalFilename.replace(/\.[^/.]+$/, '')}`,
        quality: "auto"
      });
      // Attach file info to request
      req.fileInfo = {
        url: result.secure_url,
        publicId: result.public_id,
        originalName: file.originalFilename,
        size: file.size,
        type: file.mimetype,
        format: result.format,
        projectId: parseInt(projectId)
      };

      next();
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      res.status(500).json({ 
        status: "error",
        message: "Failed to upload file to Cloudinary." 
      });
    }
  });
};

// Update file middleware
const updateFile = (req, res, next) => {
  const options = { 
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowEmptyFiles: false,
    multiples: false,
  };

  const form = new formidable.IncomingForm();
  form.multiples = options.multiples;
  form.maxFileSize = options.maxFileSize;
  form.keepExtensions = options.keepExtensions;
  form.allowEmptyFiles = options.allowEmptyFiles;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(400).json({ 
        status: "error",
        message: "Failed to process the form." 
      });
    }

    const file = files.file?.[0] || files.file;
    if (!file) {
      return res.status(400).json({ 
        status: "error",
        message: "No file uploaded." 
      });
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        status: "error",
        message: "File type not allowed."
      });
    }

    try {
      const result = await cloudinary.uploader.upload(file.filepath, {
        folder: process.env.CLOUDINARY_FOLDER,
        resource_type: "auto",
        public_id: `${Date.now()}-${file.originalFilename.replace(/\.[^/.]+$/, '')}`,
        quality: "auto"
      });

      req.fileInfo = {
        url: result.secure_url,
        publicId: result.public_id,
        originalName: file.originalFilename,
        size: file.size,
        type: file.mimetype,
        format: result.format
      };

      next();
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      res.status(500).json({ 
        status: "error",
        message: "Failed to upload file to Cloudinary." 
      });
    }
  });
};

// Delete file middleware
const deleteFile = async (req, res, next) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Delete file from Cloudinary
    const publicId = file.url.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(`${process.env.CLOUDINARY_FOLDER}/${publicId}`);

    next();
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file." });
  }
};

module.exports = {
  uploadAvatar,
  uploadFile,
  updateFile,
  deleteFile,
};


