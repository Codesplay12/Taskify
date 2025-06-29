const jwt = require("jsonwebtoken");
const User = require("../models/userModel");


//MIddleWare to protect routes

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token payload and attach to req
      req.user = await User.findById(decoded.id).select("-password"); // Use '-' to exclude password

      next();
    } else {
      res.status(401).json({ message: "Not authorized, no token" });
    }
  } catch (error) {
    res.status(401).json({ message: "Token failed", error: error.message });
  }
};


//MIDDLEWARE FOR ADMIN ONLY ACCESS

const adminOnly = (req,res, next) =>{
    if(req.user && req.user.role === "admin"){
        next();
    } 
    else{
        res.status(403).json({message:"Access denied, admin only"});
    }
};

module.exports = {protect, adminOnly}