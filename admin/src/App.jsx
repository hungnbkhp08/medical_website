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
const App = () => {
  const {aToken}= useContext(AdminContext)
  return  aToken ?(
    <div className='bg-[#F8F9FD] '>
      <ToastContainer/>
      <Navbar />
      <div className='flex item-start'>
        <Slidebar />
        <Routes>
          <Route path='/' element={<></>} />
          <Route path='/admin-dashboard' element={<Dashboard/>} />
          <Route path='all-appointments' element={<AllApointments/>} />
          <Route path='add-doctor' element={<AddDoctor/>} />
          <Route path='doctor-list' element={<DoctorList/>} />
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