import 'dotenv/config';
console.log('REDIS_HOST:', process.env.REDIS_HOST);
console.log('REDIS_PORT:', process.env.REDIS_PORT);
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';

import adminRouter from './routes/adminRoute.js';
import doctorRouter from './routes/doctorRoute.js';
import userRouter from './routes/userRoute.js';
import paymentRoute from './routes/paymentRoute.js';
import chatSocket from './sockets/chatSocket.js'; 
import chatRouter from './routes/chatRoute.js';
import reviewRoute from './routes/reviewRoute.js';
import walletRoute from './routes/walletRoute.js';
import chatbotRoute from './routes/chatbotRoute.js';
const app = express();
const port = process.env.PORT || 4000;

connectDB();
connectCloudinary();

app.use(express.json());
app.use(cors());

app.use('/api/admin', adminRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/user', userRouter);
app.use('/api/payment', paymentRoute);
app.use('/api/message', chatRouter); 
app.use('/api/review', reviewRoute);
app.use('/api/wallet', walletRoute);
app.use('/api/chatbot', chatbotRoute);

app.get('/', (req, res) => {
  res.send('API WORKING');
});

// 🔌 Tạo socket server
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});
app.set('io', io);
chatSocket(io);

// 🚀 Khởi chạy server có socket
httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});