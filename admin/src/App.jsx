import React, { useContext } from "react";
import Login from "./pages/Login";
// thông báo
import { ToastContainer, toast } from "react-toastify";
import { AppContext } from "./context/AppContext";
import { AdminContext } from "./context/AdminContext";
import Navbar from "./components/Navbar";
import Slidebar from "./components/Slidebar";
import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Admin/Dashboard";
import AllApointments from "./pages/Admin/AllApointments";
import AddDoctor from "./pages/Admin/AddDoctor";
import DoctorList from "./pages/Admin/DoctorList";
import DoctorDetail from "./pages/Admin/DoctorDetail";
import PatientRecords from "./pages/Admin/PatientRecords";
import { DoctorContext } from "./context/DoctorContext";
import DoctorDashboard from "./pages/Doctor/DoctorDashboard";
import DoctorAppointment from "./pages/Doctor/DoctorAppointment";
import DoctorProfile from "./pages/Doctor/DoctorProfile";
import DoctorChat from "./pages/Doctor/DoctorChat";
import ReviewManagement from "./pages/Admin/ReviewManagement";
import DoctorReviewManagement from "./pages/Doctor/DoctorReviewManagement";
import DoctorWallet from "./pages/Doctor/DoctorWallet";
import WalletManagement from "./pages/Admin/WalletManagement";
import Unauthorized from "./pages/Unauthorized";
import {
  AdminProtectedRoute,
  DoctorProtectedRoute,
} from "./components/ProtectedRoute";
import UnlockAccount from "./pages/UnlockAccount";
import UnlockAccountAdmin from "./pages/UnlockAccountAdmin";
const App = () => {
  const { aToken } = useContext(AdminContext);
  const { dToken } = useContext(DoctorContext);
  return (
    <>
      <ToastContainer />
      <Routes>
        {/* Public Routes - Không cần đăng nhập */}
        <Route path="/login" element={<Login />} />
        <Route path="/unlock-account" element={<UnlockAccount />} />
        <Route path="/unlock-account-admin" element={<UnlockAccountAdmin />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes - Cần đăng nhập */}
        <Route
          path="/*"
          element={
            aToken || dToken ? (
              <div className="bg-[#F8F9FD]">
                <Navbar />
                <div className="flex item-start">
                  <Slidebar />
                  <Routes>
                    {/* Admin Routes */}
                    <Route
                      path="/"
                      element={aToken ? <Dashboard /> : <DoctorDashboard />}
                    />
                    <Route
                      path="/admin-dashboard"
                      element={
                        <AdminProtectedRoute aToken={aToken}>
                          <Dashboard />
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="all-appointments"
                      element={
                        <AdminProtectedRoute aToken={aToken}>
                          <AllApointments />
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="add-doctor"
                      element={
                        <AdminProtectedRoute aToken={aToken}>
                          <AddDoctor />
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="doctor-list"
                      element={
                        <AdminProtectedRoute aToken={aToken}>
                          <DoctorList />
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="doctor-detail/:id"
                      element={
                        <AdminProtectedRoute aToken={aToken}>
                          <DoctorDetail />
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="review-management"
                      element={
                        <AdminProtectedRoute aToken={aToken}>
                          <ReviewManagement />
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="patient-records"
                      element={
                        <AdminProtectedRoute aToken={aToken}>
                          <PatientRecords />
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="wallet-management"
                      element={
                        <AdminProtectedRoute aToken={aToken}>
                          <WalletManagement />
                        </AdminProtectedRoute>
                      }
                    />

                    {/* Doctor Routes */}
                    <Route
                      path="/doctor-dashboard"
                      element={
                        <DoctorProtectedRoute dToken={dToken}>
                          <DoctorDashboard />
                        </DoctorProtectedRoute>
                      }
                    />
                    <Route
                      path="/doctor-appointment"
                      element={
                        <DoctorProtectedRoute dToken={dToken}>
                          <DoctorAppointment />
                        </DoctorProtectedRoute>
                      }
                    />
                    <Route
                      path="/doctor-profile"
                      element={
                        <DoctorProtectedRoute dToken={dToken}>
                          <DoctorProfile />
                        </DoctorProtectedRoute>
                      }
                    />
                    <Route
                      path="/doctor-reviews"
                      element={
                        <DoctorProtectedRoute dToken={dToken}>
                          <DoctorReviewManagement />
                        </DoctorProtectedRoute>
                      }
                    />
                    <Route
                      path="/doctor-wallet"
                      element={
                        <DoctorProtectedRoute dToken={dToken}>
                          <DoctorWallet />
                        </DoctorProtectedRoute>
                      }
                    />
                    <Route
                      path="/chat"
                      element={
                        <DoctorProtectedRoute dToken={dToken}>
                          <DoctorChat />
                        </DoctorProtectedRoute>
                      }
                    />
                  </Routes>
                </div>
              </div>
            ) : (
              <Login />
            )
          }
        />
      </Routes>
    </>
  );
};

export default App;
