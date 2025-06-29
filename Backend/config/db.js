const mongoose = require('mongoose')// Taskify12

 const connectDB = async () =>
{
    try {
        await mongoose.connect(process.env.MONGO_URI,{});
        console.log("DB CONNECTED");
        
    } catch (err) {
        console.error("Error connecting to MongoDB", err);
        process.exit(1);
        
    }
}

module.exports = connectDB;



//mongodb+srv://randomdhg:Taskify12@cluster0.1ytcd8n.mongodb.net/