const { storageRef } = require("../firebaseConfig");
const fs = require("fs");


const ffprobe = require("fluent-ffmpeg");
 

const uploadFile = async (filePath, fileName) => {
  try {
    const storageFile = storageRef.file(fileName);
    const fileStream = fs.createReadStream(filePath);

    return new Promise((resolve, reject) => {
      const blobStream = storageFile.createWriteStream();

      blobStream.on("error", (error) => reject(error));
      blobStream.on("finish", async () => {
        try {
      
          await storageFile.makePublic();
          const publicUrl = `https://storage.googleapis.com/${storageRef.name}/${fileName}`;
          resolve(publicUrl);
        } catch (error) {
          reject(new Error("Failed to make file public: " + error.message));
        }
      });

      fileStream.pipe(blobStream);
    });
  } catch (error) {
    throw new Error("File upload failed: " + error.message);
  }
};

const uploadFile2 = async (filePath, fileName) => {
  try {
    const storageFile = storageRef.file(fileName);
    const fileStream = fs.createReadStream(filePath);

    return new Promise((resolve, reject) => {
      const blobStream = storageFile.createWriteStream();

      blobStream.on("error", (error) => reject(error));
      blobStream.on("finish", async () => {
        try {
          await storageFile.makePublic();
          const publicUrl = `https://storage.googleapis.com/${storageRef.name}/${fileName}`;

          const { fileTypeFromFile } = await import("file-type");
          const type = await fileTypeFromFile(filePath);

          const fileData = {
            url: publicUrl,
            type: type ? type.mime : "unknown", 
          };

          resolve(fileData); 
        } catch (error) {
          reject(new Error("Failed to process file metadata: " + error.message));
        }
      });

      fileStream.pipe(blobStream);
    });
  } catch (error) {
    throw new Error("File upload failed: " + error.message);
  }
};


const deleteFileFromStorage2 = async (fileUrl) => {
  try {
    const fileName = decodeURIComponent(new URL(fileUrl).pathname.split("/").pop());
    const file = storageRef.file(fileName);

    await file.delete();
    console.log(`File deleted: ${fileName}`);
  } catch (error) {
    console.error("Error deleting file:", error.message);
    throw new Error("Failed to delete file from storage.");
  }
};

const deleteFileFromStorage = async (fileUrl) => {
  try {
    const fileName = fileUrl.split("/").pop();
    const file = storageRef.file(fileName);

    const [exists] = await file.exists();
    if (!exists) {
      console.log(`File does not exist: ${fileName}`);
      return; 
    }

    await file.delete();
    console.log(`File deleted successfully: ${fileName}`);
  } catch (error) {
    console.error(`Error deleting file: ${fileUrl}`, error.message);
    throw new Error(`Failed to delete file from storage: ${fileUrl}`);
  }
};


module.exports = { uploadFile , uploadFile2, deleteFileFromStorage};

