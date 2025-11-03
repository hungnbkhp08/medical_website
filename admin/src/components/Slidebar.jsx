import React, { useContext } from 'react'
import { AdminContext } from '../context/AdminContext'
import { assets } from '../assets/assets'
import { NavLink } from 'react-router-dom'
import { DoctorContext } from '../context/DoctorContext'
const Slidebar = () => {
  const { aToken } = useContext(AdminContext)
  const { dToken } = useContext(DoctorContext)
  return (
    <div className='min-h-screen bg-white border-r '>
      {aToken && <ul className='text-[#515151] mt-5'>
        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#5f6FFF]' : ''}`} to={'/admin-dashboard'}>
          <img src={assets.home_icon} alt="" />
          <p className='hidden md:block'>Trang chủ</p>
        </NavLink>
        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#5f6FFF]' : ''}`} to={'/all-appointments'}>
          <img src={assets.appointment_icon} alt="" />
          <p className='hidden md:block'>Lịch khám</p>
        </NavLink>
        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#5f6FFF]' : ''}`} to={'/wallet-management'}>
          <img src={assets.wallet} alt="" />
          <p className='hidden md:block'>Quản lý ví</p>
        </NavLink>
        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#5f6FFF]' : ''}`} to={'/patient-records'}>
          <img src={assets.patient} alt="" />
          <p className='hidden md:block'>Hồ sơ bệnh nhân</p>
        </NavLink>
        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#5f6FFF]' : ''}`} to={'/review-management'}>
          <img src={assets.star} alt="" />
          <p className='hidden md:block'>Quản lý đánh giá</p>
        </NavLink>
        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#5f6FFF]' : ''}`} to={'/doctor-list'}>
          <img src={assets.people_icon} alt="" />
          <p className='hidden md:block'>Danh sách bác sỹ</p>
        </NavLink>
        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#5f6FFF]' : ''}`} to={'/add-doctor'}>
          <img src={assets.add_icon} alt="" />
          <p className='hidden md:block'>Thêm bác sỹ</p>
        </NavLink>
      </ul>}
      {dToken && <ul className='text-[#515151] mt-5'>
        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#5f6FFF]' : ''}`} to={'/doctor-dashboard'}>
          <img src={assets.home_icon} alt="" />
          <p className='hidden md:block'>Trang chủ</p>
        </NavLink>
        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#5f6FFF]' : ''}`} to={'/doctor-appointment'}>
          <img src={assets.appointment_icon} alt="" />
          <p className='hidden md:block'>Lịch khám</p>
        </NavLink>
        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#5f6FFF]' : ''}`} to={'/chat'}>
          <img src={assets.chat} alt="" />
          <p className='hidden md:block'>Tin nhắn</p>
        </NavLink>
        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#5f6FFF]' : ''}`} to={'/doctor-wallet'}>
          <img src={assets.wallet} alt="" />
          <p className='hidden md:block'>Quản lý ví</p>
        </NavLink>
        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#5f6FFF]' : ''}`} to={'/doctor-reviews'}>
          <img src={assets.star} alt="" />
          <p className='hidden md:block'>Đánh giá</p>
        </NavLink>
        <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#5f6FFF]' : ''}`} to={'/doctor-profile'}>
          <img src={assets.people_icon} alt="" />
          <p className='hidden md:block'>Thông tin</p>
        </NavLink>
      </ul>}

    </div>
  )
}

export default Slidebar