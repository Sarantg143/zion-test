const express = require("express");
const Degree = require("../models/Degree.model"); // Assuming this is the correct path for your Degree model
const router = express.Router();

// Add a New Degree
router.post("/", async (req, res) => {
  try {
    const { title, description, thumbnail, price, courses } = req.body;

    const newDegree = new Degree({
      title,
      description,
      thumbnail,
      price,
      courses, // Nested structure for courses, chapters, lessons, sublessons, and tests
    });

    const savedDegree = await newDegree.save();
    res.status(201).json({ message: "Degree added successfully", degree: savedDegree });
  } catch (error) {
    console.error("Error adding degree:", error);
    res.status(500).json({ message: "Failed to add degree", error: error.message });
  }
}); 

// Edit an Existing Degree
router.put("/:id", async (req, res) => {
  try {
    const degreeId = req.params.id;
    const updates = req.body;

    // Find and update the degree by ID
    const updatedDegree = await Degree.findByIdAndUpdate(degreeId, updates, {
      new: true, // Return the updated document
      runValidators: true, // Ensure validations are run
    });

    if (!updatedDegree) {
      return res.status(404).json({ message: "Degree not found" });
    }

    res.status(200).json({ message: "Degree updated successfully", degree: updatedDegree });
  } catch (error) {
    console.error("Error updating degree:", error);
    res.status(500).json({ message: "Failed to update degree", error: error.message });
  }
});

// Export the router
module.exports = router;
