import { useContext } from "react";
import { useState } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useEffect } from "react";
const DoctorChat = () => {
  const [search, setSearch] = useState("");
  const { backendUrl, dToken, users, doctors,profileData } = useContext(DoctorContext);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selected || !profileData?._id) return;
      try {
        const { data } = await axios.post(`${backendUrl}/api/message/conversation`, {
          otherId: selected._id,
          otherRole: 'patient',
          role:"doctor"
        }, {
          headers: { dToken },
        });      
        if (data.success) {
          setMessages(data.messages);
        } else {
          console.log(dToken)
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
    if (!input.trim() || !selected) return;
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/message`,
        {
          receiverId: selected._id,
          receiverRole: "patient",
          content: input.trim(),
          role:"doctor"
        },
        { headers: { dToken } }
      );
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        setInput("");
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
          {search.trim() === "" ? (
            <p className="text-gray-400 text-sm italic">
              Nhập tên bệnh nhân để bắt đầu tìm kiếm...
            </p>
          ) : (
            users
              .filter((u) =>
                (u.name || "").toLowerCase().includes(search.toLowerCase())
              )
              .map((u) => (
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
                  </div>
                </div>
              ))
          )}
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
                alt="Bác sĩ"
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
              className={`flex ${msg.sender.id === profileData?._id ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl text-sm max-w-xs ${msg.sender.id === profileData?._id
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-white text-gray-800 border rounded-bl-none"
                  }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
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
