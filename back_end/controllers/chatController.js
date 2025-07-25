import messageModel from '../models/messageModel.js';
import doctorModel from '../models/doctorModel.js';
import userModel from '../models/userModel.js';

export const getConversation = async (req, res) => {
    const { id: myId, role: myRole } = req.user;
    const { otherId, otherRole } = req.body; // ⚠️ đã sửa lại từ query → body
  
    if (!otherId || !otherRole) {
      return res.json({ success: false, message: 'Thiếu ID hoặc vai trò của người đối thoại' });
    }
  
    try {
      const messages = await messageModel.find({
        $or: [
          {
            'sender.id': myId,
            'sender.role': myRole,
            'receiver.id': otherId,
            'receiver.role': otherRole,
          },
          {
            'sender.id': otherId,
            'sender.role': otherRole,
            'receiver.id': myId,
            'receiver.role': myRole,
          },
        ],
      }).sort({ createdAt: 1 });
  
      res.json({ success: true, messages }); // ✅ sửa lại: messages (không phải message)
    } catch (error) {
      console.error('❌ Lỗi lấy tin nhắn:', error);
      res.json({ success: false, message: 'Lỗi khi lấy cuộc trò chuyện' });
    }
  };  
/**
 * @desc Gửi tin nhắn
 * @route POST /api/message
 * @access Được bảo vệ (User hoặc Doctor)
 */
export const sendMessage = async (req, res) => {
  const { id: senderId, role: senderRole } = req.user;
  const { receiverId, receiverRole, content } = req.body;

  if (!receiverId || !receiverRole || !content?.trim()) {
    return res.json({ success: false, message: 'Thiếu thông tin người nhận hoặc nội dung' });
  }

  try {
    const newMessage = await messageModel.create({
      sender: { id: senderId, role: senderRole },
      receiver: { id: receiverId, role: receiverRole },
      content: content.trim(),
    });

    res.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('❌ Lỗi gửi tin nhắn:', error);
    res.json({ success: false, message: 'Gửi tin nhắn thất bại' });
  }
};
export const getConversationsList = async (req, res) => {
  const { id: myId, role: myRole } = req.user;

  try {
    const messages = await messageModel.find({
      $or: [
        { 'sender.id': myId },
        { 'receiver.id': myId },
      ],
    }).sort({ timestamp: -1 });

    const conversationMap = new Map();

    messages.forEach((msg) => {
      const isSender = msg.sender.id.toString() === myId.toString();
      const otherId = isSender ? msg.receiver.id.toString() : msg.sender.id.toString();
      const otherRole = isSender ? msg.receiver.role : msg.sender.role;

      const key = `${otherRole}_${otherId}`;
      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          otherId,
          otherRole,
          lastMessage: msg,
        });
      }
    });

    const conversations = await Promise.all(
      Array.from(conversationMap.values()).map(async (conv) => {
        let userInfo;
        if (conv.otherRole === 'doctor') {
          userInfo = await doctorModel.findById(conv.otherId).select('name image');
        } else if (conv.otherRole === 'patient') {
          userInfo = await userModel.findById(conv.otherId).select('name image');
        }

        return {
          [conv.otherRole]: {
            _id: userInfo?._id,
            name: userInfo?.name || "Không rõ",
            image: userInfo?.image || null
          },
          lastMessage: {
            content: conv.lastMessage.content,
            timestamp: conv.lastMessage.timestamp,
          }
        };
      })
    );

    res.json({ success: true, conversations });

  } catch (err) {
    console.error("❌ Lỗi lấy danh sách cuộc hội thoại:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};
  
  