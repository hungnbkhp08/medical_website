import React, { useContext, useEffect, useState } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";

const DoctorProfile = () => {
  const { dToken, getProfileData, profileData, setProfileData, backendUrl } =
    useContext(DoctorContext);
  const { currency } = useContext(AppContext);

  const [isEdit, setIsEdit] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const updateProfile = async () => {
    try {
      const updateData = {
        address: profileData.address,
        fees: profileData.fees,
        available: profileData.available,
      };
      const { data } = await axios.post(
        backendUrl + "/api/doctor/update-profile",
        updateData,
        { headers: { dToken } }
      );
      if (data.success) {
        toast.success(data.message);
        setIsEdit(false);
        getProfileData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const changePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }

    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/change-password",
        { currentPw, newPw },
        { headers: { dToken } }
      );

      if (data.success) {
        toast.success(data.message);
        setShowChangePw(false);
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    if (dToken) {
      getProfileData();
    }
  }, [dToken]);

  return (
    profileData && (
      <div className="p-5">
        {/* Ảnh đại diện */}
        <div className="flex justify-center mb-6">
          <img
            className="bg-[#5f6FFF]/80 w-full sm:max-w-64 rounded-lg shadow-md"
            src={profileData.image}
            alt="Doctor"
          />
        </div>

        {/* Thông tin chính */}
        <div className="border border-stone-200 rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">{profileData.name}</h2>
          <div className="flex items-center gap-3 mb-2">
            <p className="text-gray-700">
              {profileData.degree} - {profileData.speciality}
            </p>
            <p className="py-0.5 px-2 border text-xs rounded-full text-gray-600">
              {profileData.experience}
            </p>
          </div>

          {/* Giới thiệu */}
          <div className="mb-4">
            <p className="font-medium">Giới thiệu:</p>
            <p className="text-gray-600">{profileData.about}</p>
          </div>

          {/* Phí khám */}
          <div className="mb-4">
            <p className="font-medium">
              Phí khám bệnh:
              {isEdit ? (
                <span className="ml-2 text-blue-600">
                  {currency}
                  <input
                    type="number"
                    className="ml-1 border px-2 py-1 rounded w-24"
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        fees: e.target.value,
                      }))
                    }
                    value={profileData.fees}
                  />
                </span>
              ) : (
                <span className="ml-2 text-blue-600">
                  {currency} {profileData.fees}
                </span>
              )}
            </p>
          </div>

          {/* Địa chỉ */}
          <div className="mb-4">
            <p className="font-medium mb-1">Địa chỉ:</p>
            {isEdit ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  className="border px-3 py-1 rounded text-sm"
                  value={profileData.address.line1}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      address: {
                        ...prev.address,
                        line1: e.target.value,
                      },
                    }))
                  }
                />
                <input
                  type="text"
                  className="border px-3 py-1 rounded text-sm"
                  value={profileData.address.line2}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      address: {
                        ...prev.address,
                        line2: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            ) : (
              <p className="text-gray-600">
                {profileData.address.line1}
                <br />
                {profileData.address.line2}
              </p>
            )}
          </div>

          {/* Trạng thái */}
          <div className="flex items-center gap-2 mb-4">
            {isEdit ? (
              <>
                <input
                  type="checkbox"
                  id="available"
                  className="accent-blue-500"
                  checked={profileData.available}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      available: e.target.checked,
                    }))
                  }
                />
                <label htmlFor="available" className="text-sm text-gray-700">
                  Đang hoạt động
                </label>
              </>
            ) : (
              <>
                <input
                  type="checkbox"
                  id="available"
                  className="accent-blue-500"
                  checked={profileData.available}
                  readOnly
                />
                <label htmlFor="available" className="text-sm text-gray-700">
                  Đang hoạt động
                </label>
              </>
            )}
          </div>

          {/* Nút */}
          <div className="flex gap-3">
            {isEdit ? (
              <button
                onClick={updateProfile}
                className="px-4 py-2 border border-green-500 text-green-600 rounded hover:bg-green-50 transition cursor-pointer"
              >
                Lưu
              </button>
            ) : (
              <button
                onClick={() => setIsEdit(true)}
                className="px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition cursor-pointer"
              >
                Chỉnh sửa
              </button>
            )}

            {/* Nút đổi mật khẩu */}
            <button
              onClick={() => setShowChangePw(true)}
              className="px-4 py-2 border border-orange-500 text-orange-600 rounded hover:bg-orange-50 transition cursor-pointer"
            >
              Đổi mật khẩu
            </button>
          </div>
        </div>

        {/* POPUP ĐỔI MẬT KHẨU */}
        {showChangePw && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Đổi mật khẩu</h3>

              <div className="flex flex-col gap-3">
                <input
                  type="password"
                  placeholder="Mật khẩu hiện tại"
                  className="border px-3 py-2 rounded"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Mật khẩu mới"
                  className="border px-3 py-2 rounded"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Xác nhận mật khẩu"
                  className="border px-3 py-2 rounded"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => setShowChangePw(false)}
                  className="px-4 py-2 border rounded cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={changePassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer"
                >
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  );
};

export default DoctorProfile;
