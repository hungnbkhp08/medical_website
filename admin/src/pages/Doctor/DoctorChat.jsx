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
                className={`flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded-md ${selected?._id === conv.patient._id ? "bg-gray-100" : ""
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
                    className={`flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded-md ${selected?._id === u._id ? "bg-gray-100" : ""
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
                {/* <p className="text-xs text-green-600">Đang hoạt động</p> */}
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
              className={`flex flex-col ${msg.sender.id === profileData?._id ? "items-end" : "items-start"
                }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl text-sm max-w-xs break-words ${msg.sender.id === profileData?._id
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-white text-gray-800 border rounded-bl-none"
                  }`}
              >
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="Sent"
                    className="mb-2 max-w-[200px] rounded"
                  />
                )}
                {msg.content}
              </div>
              <span className="text-[11px] text-gray-400 mt-1 mr-1">
                {new Date(msg.timestamp).toLocaleString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>


        {/* Input */}
        {selected && (
          <div className="p-4 border-t bg-white flex flex-col gap-2">
            {image && (
              <div className="flex items-center gap-2">
                <img
                  src={URL.createObjectURL(image)}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded"
                />
                <button
                  onClick={() => setImage(null)}
                  className="text-sm text-red-500 underline"
                >
                  Xoá ảnh
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
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
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
                className="hidden"
                id="imageInput"
              />
              <label
                htmlFor="imageInput"
                className="bg-gray-200 text-gray-700 px-3 py-2 rounded-full text-sm cursor-pointer hover:bg-gray-300"
              >
                📎
              </label>
              <button
                onClick={handleSendMessage}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium"
              >
                Gửi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorChat;
