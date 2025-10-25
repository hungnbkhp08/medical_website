import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const PatientRecords = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const { slotDateFormat } = useContext(AppContext);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Lấy danh sách bệnh nhân
  const getPatientRecords = async () => {
    try {
      const { data } = await axios.post(backendUrl + '/api/admin/manager-patient', {}, {
        headers: { aToken }
      });
      if (data.success) {
        setPatients(data.managerPatients);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (aToken) {
      getPatientRecords();
    }
  }, [aToken]);

  // Lọc bệnh nhân
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'has-results') return matchesSearch && patient.results.length > 0;
    if (filterStatus === 'no-results') return matchesSearch && patient.results.length === 0;
    
    return matchesSearch;
  });

  // Format ngày
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5F6FFF]"></div>
      </div>
    );
  }

  return (
    <div className='w-full max-w-7xl m-5'>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản lý hồ sơ bệnh nhân</h1>
        <p className="text-gray-600">Xem và quản lý hồ sơ khám bệnh của tất cả bệnh nhân</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{patients.length}</p>
              <p className="text-sm text-gray-600">Tổng bệnh nhân</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9,10H7V12H9V10M13,10H11V12H13V10M17,10H15V12H17V10M19,3H18V1H16V3H8V1H6V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {patients.reduce((sum, p) => sum + p.appointments.length, 0)}
              </p>
              <p className="text-sm text-gray-600">Tổng lịch hẹn</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {patients.reduce((sum, p) => sum + p.results.length, 0)}
              </p>
              <p className="text-sm text-gray-600">Kết quả khám</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,9H13V15H11V9M11,17H13V19H11V17Z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {patients.filter(p => p.results.length === 0).length}
              </p>
              <p className="text-sm text-gray-600">Chưa có kết quả</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5F6FFF]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5F6FFF]"
          >
            <option value="all">Tất cả bệnh nhân</option>
            <option value="has-results">Có kết quả khám</option>
            <option value="no-results">Chưa có kết quả</option>
          </select>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bệnh nhân
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lịch hẹn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kết quả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,9H13V15H11V9M11,17H13V19H11V17Z" />
                      </svg>
                      <p>Không tìm thấy bệnh nhân nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={patient.image || 'https://via.placeholder.com/40'}
                          alt={patient.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                          <div className="text-sm text-gray-500">
                            {patient.gender || 'Chưa cập nhật'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.email}</div>
                      <div className="text-sm text-gray-500">{patient.phone || 'Chưa có'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.appointments.length} lịch hẹn
                      </div>
                      <div className="text-sm text-gray-500">
                        {patient.appointments.filter(a => a.isCompleted).length} đã hoàn thành
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        patient.results.length > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {patient.results.length > 0 
                          ? `${patient.results.length} kết quả` 
                          : 'Chưa có kết quả'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedPatient(patient)}
                        className="text-[#5F6FFF] hover:text-[#4F5FEF] transition-colors"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Hồ sơ bệnh nhân</h2>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Patient Info */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={selectedPatient.image || 'https://via.placeholder.com/80'}
                    alt={selectedPatient.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedPatient.name}</h3>
                    <p className="text-gray-600">{selectedPatient.email}</p>
                    <p className="text-gray-600">{selectedPatient.phone || 'Chưa có số điện thoại'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Giới tính</p>
                    <p className="font-medium">{selectedPatient.gender || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ngày sinh</p>
                    <p className="font-medium">{selectedPatient.dob || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Số lịch hẹn</p>
                    <p className="font-medium">{selectedPatient.appointments.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Kết quả khám</p>
                    <p className="font-medium">{selectedPatient.results.length}</p>
                  </div>
                </div>
              </div>

              {/* Appointments */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Lịch sử khám bệnh</h4>
                {selectedPatient.appointments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Chưa có lịch hẹn nào</p>
                ) : (
                  <div className="space-y-3">
                    {selectedPatient.appointments.map((apt, idx) => (
                      <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={apt.docData.image}
                              alt={apt.docData.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-medium text-gray-800">{apt.docData.name}</p>
                              <p className="text-sm text-gray-600">{apt.docData.speciality}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            apt.cancelled 
                              ? 'bg-red-100 text-red-800'
                              : apt.isCompleted 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {apt.cancelled ? 'Đã hủy' : apt.isCompleted ? 'Hoàn thành' : 'Đang chờ'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Ngày: </span>
                            <span className="font-medium">{slotDateFormat(apt.slotDate)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Giờ: </span>
                            <span className="font-medium">{apt.slotTime}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Results */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Kết quả khám bệnh</h4>
                {selectedPatient.results.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Chưa có kết quả khám nào</p>
                ) : (
                  <div className="space-y-3">
                    {selectedPatient.results.map((result, idx) => (
                      <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-800">Kết quả khám #{idx + 1}</h5>
                          <span className="text-sm text-gray-500">
                            {formatDate(result.createdAt)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Chẩn đoán:</p>
                            <p className="text-gray-800">{result.diagnosis || 'Chưa có chẩn đoán'}</p>
                          </div>
                          {result.prescription && result.prescription.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-600 font-medium mb-2">Đơn thuốc:</p>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="text-left py-2 text-gray-700">Tên thuốc</th>
                                      <th className="text-center py-2 text-gray-700">Số lượng</th>
                                      <th className="text-left py-2 text-gray-700">Đơn vị</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {result.prescription.map((med, i) => (
                                      <tr key={i} className="border-b border-gray-100 last:border-0">
                                        <td className="py-2 text-gray-800">{med.name || 'N/A'}</td>
                                        <td className="py-2 text-center text-gray-800">{med.quantity || 'N/A'}</td>
                                        <td className="py-2 text-gray-800">{med.unit || 'N/A'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecords;
