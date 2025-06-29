const express = require("express");// Taskify12
const { registerUser, loginUser, getUserProfile, updateUserProfile } = require('../controllers/authController');
const { protect} = require("../middleware/authMiddleware");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");


//AUTH ROUTES
router.post("/register", registerUser)
router.post("/login", loginUser)
router.get("/profile",protect,getUserProfile)
router.put("/profile",protect,updateUserProfile)

router.post("/upload-image", upload.single("image"),(req,res)=>
{
    if(!req.file)
    {
        return res.status(400).json({message:"No file uoploaded"});
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.status(200).json({imageUrl});
});


 



module.exports = router;