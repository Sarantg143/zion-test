const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const util = require("util");
const ffprobe = require("fluent-ffmpeg");
const { uploadFile } = require("../utils/fileUpload");

const unlinkFile = util.promisify(fs.unlink);
const uploadRouter = express.Router();

let uniqueFileName;

// Ensure the temp directory exists
const ensureTempDirectory = () => {
  const tempDir = path.join(__dirname, "../temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log(`Created temp directory at: ${tempDir}`);
  }
  return tempDir;
};

// Configure Multer for temporary file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = ensureTempDirectory(); // Ensure temp directory exists
    cb(null, tempDir); // Temporary directory
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    uniqueFileName = `${timestamp}-${file.originalname}`;
    cb(null, uniqueFileName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

// File Upload Endpoint
uploadRouter.post("/", upload.single("file"), async (req, res) => {
  try {
    // Validate if file exists
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    const tempDir = ensureTempDirectory();
    const filePath = path.join(tempDir, uniqueFileName);
    const fileMimeType = req.file.mimetype;

    console.log(`File uploaded to temp folder: ${filePath}`);

    // Validate file using ffprobe
    const validateFile = () =>
      new Promise((resolve, reject) => {
        ffprobe(filePath, (err, metadata) => {
          if (err) {
            return reject(new Error("Invalid file format or file is corrupted."));
          }
          console.log("File metadata:", metadata); // Debugging metadata
          resolve(metadata);
        });
      });

    try {
      await validateFile(); // Validate file with ffprobe

      // Upload to Firebase using the utility function
      const publicUrl = await uploadFile(filePath, uniqueFileName);

      // Cleanup temporary file
      await unlinkFile(filePath);

      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        fileUrl: publicUrl,
      });
    } catch (uploadError) {
      console.error("Upload or validation error:", uploadError.message);

      // Cleanup temporary file in case of failure
      if (fs.existsSync(filePath)) {
        await unlinkFile(filePath);
      }

      res.status(500).json({ success: false, message: uploadError.message });
    }
  } catch (error) {
    console.error("Unexpected error:", error.message);

    // Cleanup temporary file if it exists
    const tempDir = ensureTempDirectory();
    const filePath = path.join(tempDir, uniqueFileName);
    if (fs.existsSync(filePath)) {
      await unlinkFile(filePath);
    }

    res.status(500).json({
      success: false,
      message: "Unexpected error occurred during upload.",
    });
  }
});

module.exports = uploadRouter;
