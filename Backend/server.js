require("dotenv").config();

const express = require("express");
const cors = require("cors")
const path = require("path");
const { log } = require("console");
const  connectDB  = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes")
const reportRoutes = require("./routes/reportRoutes")


const app = express();


//MIDDLEWARE TO HANDLE CORS
app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // if using cookies or auth headers
}));

connectDB();

//MIDDLEWARE
app.use(express.json());

//CONNECT DB


//ROUTES

app.use("/api/auth",authRoutes);
app.use("/api/users",userRoutes);
app.use("/api/tasks",taskRoutes);
app.use("/api/reports",reportRoutes);

//Server uploads folder
app.use("/uploads", express.static(path.join(__dirname,"uploads")));




//START SERVER

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));

