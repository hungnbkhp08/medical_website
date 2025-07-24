import React, { useContext } from 'react'
import Login from './pages/Login'
// thông báo
import { ToastContainer, toast } from 'react-toastify';
import { AppContext } from './context/AppContext';
import { AdminContext } from './context/AdminContext';
import Navbar from './components/Navbar';
import Slidebar from './components/Slidebar';
import { Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Admin/Dashboard';
import AllApointments from './pages/Admin/AllApointments';
import AddDoctor from './pages/Admin/AddDoctor';
import DoctorList from './pages/Admin/DoctorList';
import { DoctorContext } from './context/DoctorContext';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorAppointment from './pages/Doctor/DoctorAppointment';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import DoctorChat from './pages/Doctor/DoctorChat';
const App = () => {
  const {aToken}= useContext(AdminContext)
  const {dToken}= useContext(DoctorContext)
  return  aToken || dToken ?(
    <div className='bg-[#F8F9FD] '>
      <ToastContainer/>
      <Navbar />
      <div className='flex item-start'>
        <Slidebar />
        <Routes>
        {/* Admin Routes */}
          <Route path='/' element={<></>} />
          <Route path='/admin-dashboard' element={<Dashboard/>} />
          <Route path='all-appointments' element={<AllApointments/>} />
          <Route path='add-doctor' element={<AddDoctor/>} />
          <Route path='doctor-list' element={<DoctorList/>} />
        {/* Doctor Routes */}
          <Route path='/doctor-dashboard' element={<DoctorDashboard/>} />
          <Route path='/doctor-appointment' element={<DoctorAppointment/>} />
          <Route path='/doctor-profile' element={<DoctorProfile/>} />
          <Route path='/chat' element={<DoctorChat/>} />
        </Routes>
      </div>
    </div>
  ):(
    <>
      <Login />
      <ToastContainer/>
    </>
  )
}

export default App