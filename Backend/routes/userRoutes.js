const express = require("express");
const {adminOnly, protect} = require("../middleware/authMiddleware");
const { getUsers, getUserById, deleteUser } = require("../controllers/userController");

const router = express.Router();

//User management Routes
router.get("/",protect,adminOnly,getUsers);
router.get("/:id",protect,getUserById);


module.exports = router;