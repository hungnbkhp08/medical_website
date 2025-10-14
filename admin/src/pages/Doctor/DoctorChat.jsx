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
  const [image, setImage] = useState(null);
  const [conversations, setConversations] = useState([]);
  const socket = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!dToken || !profileData?._id) return;

    socket.current = io(backendUrl, {
      auth: { dtoken: dToken, role: "doctor" },
    });

    return () => {
      socket.current?.disconnect();
    };
  }, [backendUrl, dToken, profileData]);

  useEffect(() => {
    if (!socket.current) return;

    const handler = (message) => {
      if (
        message.sender.id === selected?._id ||
        message.receiver.id === selected?._id
      ) {
        setMessages((prev) => [...prev, message]);
      }

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
    };

    socket.current.on("receive_message", handler);

    return () => {
      socket.current.off("receive_message", handler);
    };
  }, [selected]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await axios.post(`${backendUrl}/api/message/get-list`,{}, {
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

  const handleSendMessage = async () => {
    if (!selected) return;
    if (!input.trim() && !image) return;

    try {
      const formData = new FormData();
      formData.append("receiverId", selected._id);
      formData.append("receiverRole", "patient");
      formData.append("content", input.trim());
      if (image) {
        formData.append("image", image);
      }

      const { data } = await axios.post(`${backendUrl}/api/message`, formData, {
        headers: {
          dToken,
          "Content-Type": "multipart/form-data",
        },
      });

      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        setInput("");
        setImage(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Không gửi được tin nhắn");
      console.error(error);
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-50 to-gray-100 flex font-sans">
      {/* Sidebar trái */}
      <div className="w-[30%] min-w-[280px] bg-white border-r border-gray-200 px-4 py-6 overflow-y-auto shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-[#5F6FFF] to-[#4F5FEF] rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Tin nhắn</h2>
        </div>
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Tìm bệnh nhân..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5F6FFF]/20 focus:border-[#5F6FFF] transition-all duration-200 bg-gray-50 hover:bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <div className="space-y-2">
          {search.trim() === ""
            ? conversations.map((conv) => {
              const isSelected = selected?._id === conv.patient._id;
              return (
                <div
                  key={conv.patient._id}
                  onClick={() => setSelected(conv.patient)}
                  className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all duration-200 ${
                    isSelected 
                      ? "bg-gradient-to-r from-[#5F6FFF]/10 to-[#4F5FEF]/10 border border-[#5F6FFF]/20 shadow-sm" 
                      : "hover:bg-gray-50 hover:shadow-sm"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={conv.patient.image || "https://i.pravatar.cc/150?img=3"}
                      alt={conv.patient.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${isSelected ? "text-[#5F6FFF]" : "text-gray-900"}`}>
                      {conv.patient.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {conv.lastMessage?.content || "Chưa có tin nhắn"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {conv.lastMessage?.timestamp
                        ? new Date(conv.lastMessage.timestamp).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : ""}
                    </span>
                    {conv?.unreadCount > 0 && (
                      <div className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {conv.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
            : users
              .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
              .map((u) => {
                const conv = conversations.find((c) => c.patient._id === u._id);
                const isSelected = selected?._id === u._id;
                return (
                  <div
                    key={u._id}
                    onClick={() => setSelected(u)}
                    className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all duration-200 ${
                      isSelected 
                        ? "bg-gradient-to-r from-[#5F6FFF]/10 to-[#4F5FEF]/10 border border-[#5F6FFF]/20 shadow-sm" 
                        : "hover:bg-gray-50 hover:shadow-sm"
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={u.image || "https://i.pravatar.cc/150?img=3"}
                        alt={u.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${isSelected ? "text-[#5F6FFF]" : "text-gray-900"}`}>
                        {u.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {conv?.lastMessage?.content || "Chưa có tin nhắn"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {conv?.lastMessage?.timestamp && (
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(conv.lastMessage.timestamp).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      {conv?.unreadCount > 0 && (
                        <div className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* Khung chat phải */}
      <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 bg-white flex items-center gap-4 shadow-sm">
          {selected ? (
            <>
              <div className="relative">
                <img
                  src={selected.image || "https://i.pravatar.cc/150?img=3"}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md"
                  alt="Bệnh nhân"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{selected.name}</p>
                {/* <p className="text-sm text-green-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Đang hoạt động
                </p> */}
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center w-full py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
              </div>
              <p className="text-gray-500 text-lg font-medium">Chọn bệnh nhân để bắt đầu nhắn tin</p>
              <p className="text-gray-400 text-sm mt-1">Tìm kiếm và chọn bệnh nhân từ danh sách bên trái</p>
            </div>
          )}
        </div>

        {/* Tin nhắn */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, index) => {
            const isDoctor = msg.sender.id === profileData?._id;
            return (
              <div
                key={index}
                className={`flex flex-col ${isDoctor ? "items-end" : "items-start"}`}
              >
                <div className={`flex items-end gap-2 ${isDoctor ? "flex-row-reverse" : "flex-row"}`}>
                  {!isDoctor && (
                    <img
                      src={selected?.image || "https://i.pravatar.cc/150?img=3"}
                      alt="Patient"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div className="flex flex-col">
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm max-w-xs break-words shadow-sm ${
                        isDoctor
                          ? "bg-gradient-to-r from-[#5F6FFF] to-[#4F5FEF] text-white rounded-br-md"
                          : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                      }`}
                    >
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="Sent"
                          className="mb-2 max-w-[200px] rounded-lg shadow-sm"
                        />
                      )}
                      <p className="leading-relaxed">{msg.content}</p>
                    </div>
                    <span className={`text-xs text-gray-400 mt-1 ${isDoctor ? "text-right" : "text-left"}`}>
                      {new Date(msg.timestamp).toLocaleString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>


        {/* Input */}
        {selected && (
          <div className="p-5 border-t border-gray-200 bg-white shadow-lg">
            {image && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                <img
                  src={URL.createObjectURL(image)}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg shadow-sm"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Ảnh đã chọn</p>
                  <p className="text-xs text-gray-500">{image.name}</p>
                </div>
                <button
                  onClick={() => setImage(null)}
                  className="p-1 hover:bg-red-100 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#5F6FFF]/20 focus:border-[#5F6FFF] transition-all duration-200"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  className="hidden"
                  id="imageInput"
                />
                <label
                  htmlFor="imageInput"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                  title="Đính kèm ảnh"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                  </svg>
                </label>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() && !image}
                className="bg-gradient-to-r from-[#5F6FFF] to-[#4F5FEF] hover:from-[#4F5FEF] hover:to-[#3F4FDF] disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-full transition-all duration-200 shadow-md hover:shadow-lg"
                title="Gửi tin nhắn"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorChat;
