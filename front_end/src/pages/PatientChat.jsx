import { useContext, useEffect, useState, useRef } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { io } from "socket.io-client";

const PatientChat = () => {
  const { backendUrl, token, userData, doctors } = useContext(AppContext);
  const [search, setSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState([]);
  const socket = useRef(null);
  const messagesEndRef = useRef(null); // cuộn cuối khung chat

  // Kết nối đến socket.io server
  useEffect(() => {
    if (!token || !userData?._id) return;
  
    socket.current = io(backendUrl, {
      auth: { token, role: "patient" },
    });
  
    return () => {
      socket.current?.disconnect();
    };
  }, [backendUrl, token, userData]);
  useEffect(() => {
    if (!socket.current) return;
  
    const handler = (message) => {
      if (
        message.sender.id === selectedDoctor?._id ||
        message.receiver.id === selectedDoctor?._id
      ) {
        setMessages((prev) => [...prev, message]);
      }
  
      setConversations((prev) =>
        prev.map((conv) =>
          conv.doctor._id ===
          (message.sender.role === "doctor"
            ? message.sender.id
            : message.receiver.id)
            ? { ...conv, lastMessage: message }
            : conv
        )
      );
    };
  
    socket.current.on("receive_message", handler);
  
    return () => {
      socket.current.off("receive_message", handler); // cleanup tránh lặp listener
    };
  }, [selectedDoctor]);
    
  

  // Tự động cuộn xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Lấy danh sách cuộc hội thoại
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/message/get-list`, {
          headers: { token },
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

    fetchConversations();
  }, [token]);

  // Load tin nhắn khi chọn bác sĩ
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedDoctor || !userData?._id) return;
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/message/conversation`,
          {
            otherId: selectedDoctor._id,
            otherRole: "doctor",
            role: "patient",
          },
          {
            headers: { token },
          }
        );
        if (data.success) {
          const sorted = data.messages.sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
          setMessages(sorted);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error("Lỗi khi tải tin nhắn");
        console.error(error);
      }
    };

    fetchMessages();
  }, [selectedDoctor, userData]);

  // Gửi tin nhắn
  const handleSendMessage = async () => {
    if (!input.trim() || !selectedDoctor) return;
    try {
      const content = input.trim();
      const { data } = await axios.post(
        `${backendUrl}/api/message`,
        {
          receiverId: selectedDoctor._id,
          receiverRole: "doctor",
          content,
          role: "patient",
        },
        { headers: { token } }
      );
  
      if (data.success) {
        const message = data.message;
        setMessages((prev) => [...prev, message]);
        setInput("");
  
        // ❌ KHÔNG cần emit nữa nếu BE đã emit ngược lại cho cả 2 phía
        // socket.current?.emit("send_message", ...); // bỏ dòng này đi
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Không gửi được tin nhắn");
      console.error(error);
    }
  };  
  
  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar trái: Danh sách bác sĩ */}
      <div className="w-[30%] min-w-[280px] bg-white border-r px-4 py-6 overflow-y-auto shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Tin nhắn</h2>
        <input
          type="text"
          placeholder="🔍 Tìm bác sĩ..."
          className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="space-y-3">
          {search.trim() === ""
            ? conversations.map((conv) => (
                <div
                  key={conv.doctor._id}
                  onClick={() => setSelectedDoctor(conv.doctor)}
                  className={`flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded-md ${
                    selectedDoctor?._id === conv.doctor._id ? "bg-gray-100" : ""
                  }`}
                >
                  <img
                    src={conv.doctor.image || "https://i.pravatar.cc/150?img=3"}
                    alt={conv.doctor.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{conv.doctor.name}</p>
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
            : doctors
                .filter((doc) =>
                  doc.name.toLowerCase().includes(search.toLowerCase())
                )
                .map((doc) => {
                  const conv = conversations.find(
                    (c) => c.doctor._id === doc._id
                  );
                  return (
                    <div
                      key={doc._id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded-md ${
                        selectedDoctor?._id === doc._id ? "bg-gray-100" : ""
                      }`}
                    >
                      <img
                        src={doc.image || "https://i.pravatar.cc/150?img=3"}
                        alt={doc.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {conv?.lastMessage?.content || "Chưa có tin nhắn"}
                        </p>
                      </div>
                      {conv?.lastMessage?.timestamp && (
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(conv.lastMessage.timestamp).toLocaleTimeString(
                            "vi-VN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
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
          {selectedDoctor ? (
            <>
              <img
                src={selectedDoctor.image || "https://i.pravatar.cc/150?img=3"}
                className="w-10 h-10 rounded-full"
                alt="Bác sĩ"
              />
              <div>
                <p className="font-medium text-base">{selectedDoctor.name}</p>
                <p className="text-xs text-green-600">Đang hoạt động</p>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm">Chọn bác sĩ để bắt đầu nhắn tin</p>
          )}
        </div>

        {/* Tin nhắn */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 pb-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender.id === userData?._id
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl text-sm max-w-xs ${
                  msg.sender.id === userData?._id
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
        {selectedDoctor && (
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

export default PatientChat;
