import React, { useContext } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home';
import Doctors from './pages/Doctors';
import Login from './pages/Login'
import About from './pages/About';
import Contact from './pages/Contact';
import MyProfile from './pages/MyProfile';
import MyAppointments from './pages/MyAppointments';
import Appointment from './pages/Appointment'
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ToastContainer } from 'react-toastify';
import PaymentSuccess from './pages/PaymentSuccess';
import Chatbot from './components/Chatbot';
import PatientChat from './pages/PatientChat';
import Unauthorized from './pages/Unauthorized';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppContext } from './context/AppContext';
import UnlockAccount from './pages/UnlockAccount';

// import provider của Google
import { GoogleOAuthProvider } from '@react-oauth/google';

const App = () => {
  const location = useLocation();
  const hideFooter = location.pathname === '/chat';
  const { token } = useContext(AppContext);

  return (
    // Bọc toàn bộ App bằng GoogleOAuthProvider
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className='mx-4 sm:mx-[10%]'>
        <ToastContainer />
        <Navbar />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/doctors' element={<Doctors />} />
          <Route path='/doctors/:speciality' element={<Doctors />} />
          <Route path='/login' element={<Login />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/unlock-account' element={<UnlockAccount />} />
          <Route path='/my-profile' element={
            <ProtectedRoute token={token}>
              <MyProfile />
            </ProtectedRoute>
          } />
          <Route path='/my-appointments' element={
            <ProtectedRoute token={token}>
              <MyAppointments />
            </ProtectedRoute>
          } />
          <Route path='/appointment/:docId' element={
            <ProtectedRoute token={token}>
              <Appointment />
            </ProtectedRoute>
          } />
          <Route path='/payment-success' element={
            <ProtectedRoute token={token}>
              <PaymentSuccess />
            </ProtectedRoute>
          } />
          <Route path='/chat' element={
            <ProtectedRoute token={token}>
              <PatientChat />
            </ProtectedRoute>
          } />
          <Route path='/unauthorized' element={<Unauthorized />} />
        </Routes>
        {!hideFooter && <Footer />}
        {token && <Chatbot />}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App
