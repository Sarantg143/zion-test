const fs = require("fs");
const path = require("path");

// Delete file from the temp folder
const deleteTempFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) console.error("Error deleting temp file:", err);
    else console.log("Temp file deleted:", filePath);
  });
};

module.exports = { deleteTempFile };
