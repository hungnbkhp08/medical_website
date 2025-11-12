import React, { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const MyProfile = () => {
  const { userData, setUserData, token, backendUrl, loadUserProfileData } = useContext(AppContext)
  const [isEdit, setIsEdit] = useState(false)
  const [isChangePassword, setIsChangePassword] = useState(false)
  const [image, setImage] = useState(false)

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const validateImage = (file) => {
    if (!file) {
      toast.error('Vui lòng chọn file')
      return false
    }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)')
      return false
    }
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Kích thước ảnh không được vượt quá 5MB')
      return false
    }
    return true
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file && validateImage(file)) {
      setImage(file)
    } else {
      e.target.value = ''
      setImage(false)
    }
  }

  const updateProfile = async () => {
    try {
      const formData = new FormData()
      formData.append('name', userData.name)
      formData.append('phone', userData.phone)
      formData.append('address', JSON.stringify(userData.address))
      formData.append('gender', userData.gender)
      formData.append('dob', userData.dob)
      image && formData.append('image', image)
      const { data } = await axios.post(backendUrl + '/api/user/update-profile', formData, { headers: { token } })
      if (data.success) {
        toast.success(data.message)
        await loadUserProfileData()
        setIsEdit(false)
        setImage(false)
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }
    try {
      const { data } = await axios.post(
        backendUrl + '/api/user/change-password',
        passwordData,
        { headers: { token } }
      )
      if (data.success) {
        toast.success(data.message)
        setIsChangePassword(false)
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  return userData && (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-xl">
        {!isChangePassword ? (
          <>
            <div className="flex flex-col items-center">
              {isEdit ? (
                <label htmlFor="image">
                  <div className="relative cursor-pointer">
                    <img
                      className="w-36 h-36 rounded-full object-cover opacity-80"
                      src={image ? URL.createObjectURL(image) : userData.image}
                      alt=""
                    />
                    {!image && (
                      <img
                        className="w-10 absolute bottom-2 right-2 bg-white p-1 rounded-full shadow"
                        src={assets.upload_icon}
                        alt=""
                      />
                    )}
                  </div>
                  <input
                    onChange={handleImageChange}
                    accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                    type="file"
                    id="image"
                    hidden
                  />
                </label>
              ) : (
                <img
                  className="w-36 h-36 rounded-full object-cover shadow-md"
                  src={userData.image}
                  alt=""
                />
              )}

              {isEdit ? (
                <input
                  className="bg-gray-100 text-2xl font-medium mt-4 text-center rounded-md px-2"
                  type="text"
                  value={userData.name}
                  onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                />
              ) : (
                <p className="font-semibold text-2xl text-neutral-800 mt-4">{userData.name}</p>
              )}
            </div>

            <hr className="my-4 border-gray-300" />

            <div>
              <p className="text-neutral-500 font-semibold mb-2">THÔNG TIN LIÊN HỆ</p>
              <div className="grid grid-cols-[1fr_2fr] gap-y-2 text-neutral-700">
                <p className="font-medium">Email:</p>
                <p className="text-blue-500">{userData.email}</p>

                <p className="font-medium">Số điện thoại:</p>
                {isEdit ? (
                  <input
                    className="bg-gray-100 rounded-md px-2"
                    type="text"
                    value={userData.phone}
                    onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                ) : (
                  <p className="text-blue-400">{userData.phone}</p>
                )}

                <p className="font-medium">Địa chỉ:</p>
                {isEdit ? (
                  <div className="flex flex-col gap-1">
                    <input
                      className="bg-gray-100 rounded-md px-2"
                      type="text"
                      value={userData.address.line1}
                      onChange={(e) =>
                        setUserData(prev => ({
                          ...prev,
                          address: { ...prev.address, line1: e.target.value }
                        }))
                      }
                    />
                    <input
                      className="bg-gray-100 rounded-md px-2"
                      type="text"
                      value={userData.address.line2}
                      onChange={(e) =>
                        setUserData(prev => ({
                          ...prev,
                          address: { ...prev.address, line2: e.target.value }
                        }))
                      }
                    />
                  </div>
                ) : (
                  <p className="text-gray-500">
                    {userData.address.line1}
                    <br />
                    {userData.address.line2}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-neutral-500 font-semibold mb-2">THÔNG TIN CƠ BẢN</p>
              <div className="grid grid-cols-[1fr_2fr] gap-y-2 text-neutral-700">
                <p className="font-medium">Giới tính:</p>
                {isEdit ? (
                  <select
                    className="bg-gray-100 rounded-md px-2"
                    value={userData.gender}
                    onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                ) : (
                  <p className="text-gray-400">{userData.gender}</p>
                )}

                <p className="font-medium">Ngày sinh:</p>
                {isEdit ? (
                  <input
                    className="bg-gray-100 rounded-md px-2"
                    type="date"
                    value={userData.dob}
                    onChange={(e) => setUserData(prev => ({ ...prev, dob: e.target.value }))}
                  />
                ) : (
                  <p className="text-gray-400">{userData.dob}</p>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-10">
              {isEdit ? (
                <button
                  className="border border-[#5f6FFF] px-6 py-2 rounded-full cursor-pointer hover:bg-[#5f6FFF] hover:text-white transition-all"
                  onClick={updateProfile}
                >
                  Lưu thông tin
                </button>
              ) : (
                <>
                  <button
                    className="border border-[#5f6FFF] px-6 py-2 rounded-full cursor-pointer hover:bg-[#5f6FFF] hover:text-white transition-all"
                    onClick={() => setIsEdit(true)}
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    className="border border-[#FF5F5F] px-6 py-2 rounded-full cursor-pointer hover:bg-[#FF5F5F] hover:text-white transition-all"
                    onClick={() => setIsChangePassword(true)}
                  >
                    Đổi mật khẩu
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-center mb-6">Đổi mật khẩu</h2>
            <div className="flex flex-col gap-4">
              <input
                type="password"
                placeholder="Mật khẩu hiện tại"
                className="bg-gray-100 p-2 rounded-md"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              />
              <input
                type="password"
                placeholder="Mật khẩu mới"
                className="bg-gray-100 p-2 rounded-md"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              />
              <input
                type="password"
                placeholder="Xác nhận mật khẩu mới"
                className="bg-gray-100 p-2 rounded-md"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
              <div className="flex justify-center gap-4 mt-4">
                <button
                  className="border border-[#5f6FFF] px-6 py-2 rounded-full hover:bg-[#5f6FFF] hover:text-white transition-all"
                  onClick={handleChangePassword}
                >
                  Lưu mật khẩu
                </button>
                <button
                  className="border border-gray-400 px-6 py-2 rounded-full hover:bg-gray-200 transition-all"
                  onClick={() => setIsChangePassword(false)}
                >
                  Quay lại
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MyProfile
