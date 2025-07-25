import { useContext, useState, useEffect, useRef } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import axios from "axios";
import { toast } from "react-toastify";
import { io } from "socket.io-client";

const DoctorChat = () => {
  const [search, setSearch] = useState("");
  const { backendUrl, dToken, users, doctors, profileData } = useContext(DoctorContext);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState([]);
  const socket = useRef(null);
  const messagesEndRef = useRef(null);

  // Kết nối socket
  useEffect(() => {
    if (!dToken || !profileData?._id) return;
  
    socket.current = io(backendUrl, {
      auth: { dtoken:dToken, role: "doctor" },
    });
  
    // ✅ Lắng nghe nhận tin nhắn
    socket.current.on("receive_message", (message) => {
      if (
        message.sender.id === selected?._id ||
        message.receiver.id === selected?._id
      ) {
        setMessages((prev) => [...prev, message]);
      }
  
      // ✅ Cập nhật lastMessage trong cuộc hội thoại
      setConversations((prev) =>
        prev.map((conv) =>
          conv.patient._id ===
          (message.sender.role === "patient"
            ? message.sender.id
            : message.receiver.id)
            ? { ...conv, lastMessage: message }
            : conv
        )
      );
    });
  
    return () => {
      socket.current?.disconnect();
    };
  },  [backendUrl, dToken, profileData]);

  // Nghe tin nhắn realtime
  // useEffect(() => {
  //   if (!socket.current) return;

  //   const handleNewMessage = (message) => {
  //     if (
  //       message.sender.id === selected?._id ||
  //       message.receiver.id === selected?._id
  //     ) {
  //       setMessages((prev) => [...prev, message]);
  //     }

  //     // Cập nhật lại danh sách cuộc hội thoại
  //     setConversations((prevConvs) => {
  //       const updated = prevConvs.map((conv) =>
  //         conv.patient._id ===
  //           (message.sender.role === "patient" ? message.sender.id : message.receiver.id)
  //           ? { ...conv, lastMessage: message }
  //           : conv
  //       );
  //       return updated;
  //     });
  //   };

  //   socket.current.on("newMessage", handleNewMessage);

  //   return () => {
  //     socket.current.off("newMessage", handleNewMessage);
  //   };
  // }, [selected]);

  // Cuộn xuống cuối khi có tin nhắn
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Lấy danh sách cuộc hội thoại
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/message/get-list`, {
          headers: { dToken },
        });
        if (data.success) {
          setConversations(data.conversations);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error("Không thể tải danh sách cuộc hội thoại");
        console.error(error);
      }
    };

    if (dToken) fetchConversations();
  }, [dToken]);

  // Lấy tin nhắn khi chọn người
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selected || !profileData?._id) return;
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/message/conversation`,
          {
            otherId: selected._id,
            otherRole: "patient",
            role: "doctor",
          },
          {
            headers: { dToken },
          }
        );
        if (data.success) {
          const sortedMessages = data.messages.sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
          setMessages(sortedMessages);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        console.error(error);
        toast.error("Lỗi khi tải tin nhắn");
      }
    };

    fetchMessages();
  }, [selected, profileData]);

  // Gửi tin nhắn
  const handleSendMessage = async () => {
    if (!input.trim() || !selected) return;
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/message`,
        {
          receiverId: selected._id,
          receiverRole: "patient",
          content: input.trim(),
          role: "doctor",
        },
        { headers: { dToken } }
      );
  
      if (data.success) {
        const message = data.message;
        setMessages((prev) => [...prev, message]);
        setInput("");
  
        // ✅ Gửi socket đúng format
        socket.current?.emit("send_message", {
          receiver: {
            id: selected._id,
            role: "patient",
          },
          content: input.trim(),
        });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Không gửi được tin nhắn");
      console.error(error);
    }
  };
  return (
    <div className="h-screen w-screen bg-gray-50 flex font-sans">
      {/* Sidebar trái */}
      <div className="w-[30%] min-w-[280px] bg-white border-r px-4 py-6 overflow-y-auto shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Tin nhắn</h2>
        <input
          type="text"
          placeholder="🔍 Tìm bệnh nhân..."
          className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="space-y-3">
          {search.trim() === ""
            ? conversations.map((conv) => (
                <div
                  key={conv.patient._id}
                  onClick={() => setSelected(conv.patient)}
                  className={`flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded-md ${
                    selected?._id === conv.patient._id ? "bg-gray-100" : ""
                  }`}
                >
                  <img
                    src={conv.patient.image || "https://i.pravatar.cc/150?img=3"}
                    alt={conv.patient.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{conv.patient.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {conv.lastMessage?.content || "Chưa có tin nhắn"}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {conv.lastMessage?.timestamp
                      ? new Date(conv.lastMessage.timestamp).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
              ))
            : users
                .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
                .map((u) => {
                  const conv = conversations.find((c) => c.patient._id === u._id);
                  return (
                    <div
                      key={u._id}
                      onClick={() => setSelected(u)}
                      className={`flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded-md ${
                        selected?._id === u._id ? "bg-gray-100" : ""
                      }`}
                    >
                      <img
                        src={u.image || "https://i.pravatar.cc/150?img=3"}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{u.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {conv?.lastMessage?.content || "Chưa có tin nhắn"}
                        </p>
                      </div>
                      {conv?.lastMessage?.timestamp && (
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(conv.lastMessage.timestamp).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                  );
                })}
        </div>
      </div>

      {/* Khung chat phải */}
      <div className="flex-1 flex flex-col justify-between bg-[#FFF6F6]">
        {/* Header */}
        <div className="p-4 border-b bg-white flex items-center gap-3 shadow-sm">
          {selected ? (
            <>
              <img
                src={selected.image || "https://i.pravatar.cc/150?img=3"}
                className="w-10 h-10 rounded-full"
                alt="Bệnh nhân"
              />
              <div>
                <p className="font-medium text-base">{selected.name}</p>
                <p className="text-xs text-green-600">Đang hoạt động</p>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm">Chọn bệnh nhân để bắt đầu nhắn tin</p>
          )}
        </div>

        {/* Tin nhắn */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender.id === profileData?._id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl text-sm max-w-xs ${
                  msg.sender.id === profileData?._id
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-white text-gray-800 border rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {selected && (
          <div className="p-4 border-t bg-white flex items-center gap-2">
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium"
            >
              Gửi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorChat;