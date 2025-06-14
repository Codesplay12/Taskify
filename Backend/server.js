import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { connectDB } from './config/db.js';

import userRouter from './routes/userRoute.js';
import taskRouter from './routes/taskRoutes.js';

const app = express();
const port = process.env.PORT || 4000;

//MiddleWare

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//DB connect 
connectDB();

//Routes

app.use("/api/user",userRouter);
app.use('/api/task',taskRouter);

app.get('/',(req,res)=>
{
    res.send('api working');
})

app.listen(port,() =>
{
    console.log(`server started on http://localhost${port}`);
    
})