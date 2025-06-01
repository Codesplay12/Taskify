import mongoose from 'mongoose';// Taskify12

export const connectDB = async () =>
{
    await mongoose.connect('mongodb+srv://randomdhg:Taskify12@cluster0.1ytcd8n.mongodb.net/ ')
    .then(() => console.log('DB CONNECTED')
    );
}