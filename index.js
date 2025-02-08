
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");  
const bodyParser = require("body-parser");

dotenv.config();

const userRoutes = require("./routes/User.router");
const degreeRoutes = require("./routes/Degree.router");
const completeRoutes = require("./routes/Completed.router");
const eventRouter = require('./routes/Event.router');
const adminEventRouter = require('./routes/AdminEvent.router');
const answerRouter = require('./routes/Answer.router');
const degreeRoutes1 = require("./routes/Degree1.router");
const upload = require("./routes/Upload.router");
const NotificationRouter = require('./routes/Notification.router');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS 
app.use(cors()); 
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 
 

// // MongoDB connection
// mongoose
//   .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((err) => console.error("MongoDB connection error:", err));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/degrees",degreeRoutes);
app.use("/api/complete",completeRoutes);
app.use('/api/event',eventRouter);
app.use('/api/admin-event',adminEventRouter);
app.use('/api/answer',answerRouter);
app.use("/api/degre",degreeRoutes1);
app.use("/api/upload",upload);
app.use('/api/notification',NotificationRouter);

app.get("/", (req, res) => {
  res.send("Welcome to Zions API");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
