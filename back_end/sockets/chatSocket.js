import jwt from 'jsonwebtoken';
import messageModel from '../models/messageModel.js';

export default function chatSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const dtoken = socket.handshake.auth?.dtoken;
    if (!token && !dtoken) {
      return next(new Error('No token or dtoken provided'));
    }

    try {
      let decoded;
      let role;

      if (dtoken) {
        decoded = jwt.verify(dtoken, process.env.JWT_SECRET); // dùng chung key hoặc tách cũng được
        role = 'doctor';
      } else {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        role = 'patient';
      }

      socket.user = {
        id: decoded.id,
        role
      };

      next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.user;
    const room = `${role}-${id}`;
    socket.join(room);
    console.log(`${role} ${id} connected and joined room ${room}`);

    socket.on('send_message', async ({ receiver, content, image }) => {
      try {
        const message = new messageModel({
          sender: { id, role },
          receiver,
          content,
          image, // thêm trường image nếu có
        });
    
        await message.save();
    
        const receiverRoom = `${receiver.role}-${receiver.id}`;
        io.to(receiverRoom).emit('receive_message', message);
    
        const senderRoom = `${role}-${id}`;
        io.to(senderRoom).emit('message_sent', message);
      } catch (err) {
        console.error(' Error sending message:', err);
        socket.emit('error_message', 'Gửi tin nhắn thất bại');
      }
    });    

    socket.on('disconnect', () => {
      console.log(`${role} ${id} disconnected`);
    });
  });
}
