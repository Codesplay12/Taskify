const User = require("../models/userModel");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

//GENERATE TOKEN
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role }, // include role
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};


// @desc register a new user
// @route Post/api/auth/register
//@access Public

const registerUser = async(req,res) =>{
try {
    const {name, email,password,profileImageUrl, adminInviteToken} = req.body;

    // check if user already exist
    const userExists = await User.findOne({email});
    if(userExists){
        return res.status(400).json({message:"User already exist ",})

    }

    //Determine user role: Admin if coorect toke is provided, otherwise member
    let role = "member";
    if(adminInviteToken && adminInviteToken == process.env.ADMIN_INVITE_TOKEN)
    {
        role = "admin";
    }

    //Hash Password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password,salt);

    //create new user

    const user = await User.create({
        name,email,password:hashedPassword,profileImageUrl,role
    });

    //return user data with jwt

    res.status(201).json({
      _id:user._id,
      name:user.name,
      email:user.email,
      role:user.role,
      profileImageUrl:user.profileImageUrl,
      token:generateToken(user),
    });
} catch (error) {
    res.status(500).json({message:"Server error", error:error.message});
}
}

// @desc login user
// @route Post/api/auth/login
//@access Public

const loginUser = async(req,res) => {
    try {
    const {email, password} = req.body;
    
    const user = await User.findOne({email});
    if(!user)
    {
        return res.status(401).json({message:"Invalid email or password"});
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch)
    {
        return res.status(401).json({message:"Invalid email or password"})
    }

    res.json({
        id: user._id,
        name:user.name,
        email:user.email,
        role:user.role,
        profileImageUrl:user.profileImageUrl,
        token: generateToken(user),
    });

} catch (error) {
    res.status(500).json({message:"Server error", error:error.message});
}
}

// @desc user profile
// @route GET/api/auth/profile
//@access private (requires JWT)

const getUserProfile = async(req,res) => {
    try {
    const user = await User.findById(req.user.id).select("-password");
    if(!user)
    {
        return res.status(404).json({message:"User not found"});
    }
    res.json(user);
} catch (error) {
    res.status(500).json({message:"Server error", error:error.message});
}
};

// @desc update user profile
// @route PUT/api/auth/profile
//@access private (requires JWT)

const updateUserProfile = async(req,res) => {
    try {
    const user = await User.findById(req.user.id);

    if(!user)
    {
        return res.status(400).json({message:"User not found"});
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if(req.body.password)
    {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password,salt)
    }

    const updatedUser = await user.save();
    res.json({
         id: updatedUser._id,
        name:updatedUser.name,
        email:updatedUser.email,
        role:updatedUser.role,
        profileImageUrl:updatedUser.profileImageUrl,
        token: generateToken(updatedUser._id),
    })

} catch (error) {
    res.status(500).json({message:"Server error", error:error.message});
}
}


module.exports = {registerUser,loginUser,getUserProfile,updateUserProfile};


