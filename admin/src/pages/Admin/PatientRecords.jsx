import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Users, 
  Calendar, 
  FileText, 
  AlertCircle, 
  Search, 
  X, 
  Eye, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Pill,
  Stethoscope,
  Activity,
  User
} from 'lucide-react';

const PatientRecords = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const { slotDateFormat } = useContext(AppContext);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, has-results, no-results
  const [activeModalTab, setActiveModalTab] = useState('overview'); // overview, appointments, results

  // Lấy danh sách bệnh nhân
  const getPatientRecords = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post(
        backendUrl + '/api/admin/manager-patient',
        {},
        { headers: { aToken } }
      );
      if (data.success) {
        setPatients(data.managerPatients || []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Không thể tải danh sách bệnh nhân');
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
  const filteredPatients = patients.filter((patient) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      patient.name?.toLowerCase().includes(term) ||
      patient.email?.toLowerCase().includes(term) ||
      patient.phone?.toLowerCase().includes(term);

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'has-results') return matchesSearch && (patient.results?.length || 0) > 0;
    if (filterStatus === 'no-results') return matchesSearch && (!patient.results || patient.results.length === 0);

    return matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const totalAppointments = patients.reduce((sum, p) => sum + (p.appointments?.length || 0), 0);
  const totalResults = patients.reduce((sum, p) => sum + (p.results?.length || 0), 0);
  const pendingResultsCount = patients.filter((p) => !p.results || p.results.length === 0).length;

  return (
    <div className="w-full max-w-7xl m-5 pr-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Hồ sơ bệnh nhân</h1>
          <p className="text-xs text-gray-500 mt-0.5">Quản lý lịch sử khám bệnh, chẩn đoán và đơn thuốc của bệnh nhân</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-medium text-gray-500">Tổng bệnh nhân</p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">{patients.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-700">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-medium text-gray-500">Tổng lượt khám</p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">{totalAppointments}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-medium text-gray-500">Hồ sơ có kết quả</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-semibold text-gray-800">{totalResults}</span>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">Đã khám</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-medium text-gray-500">Chưa có kết quả</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-semibold text-gray-800">{pendingResultsCount}</span>
              {pendingResultsCount > 0 && (
                <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">Chờ khám</span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3.5 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, email, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-gray-800 text-white'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Tất cả ({patients.length})
          </button>
          <button
            onClick={() => setFilterStatus('has-results')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterStatus === 'has-results'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Đã có kết quả ({patients.length - pendingResultsCount})
          </button>
          <button
            onClick={() => setFilterStatus('no-results')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterStatus === 'no-results'
                ? 'bg-amber-600 text-white'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Chưa có kết quả ({pendingResultsCount})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Bệnh nhân</th>
                <th className="py-3 px-4">Thông tin liên hệ</th>
                <th className="py-3 px-4 text-center">Lịch hẹn</th>
                <th className="py-3 px-4 text-center">Hồ sơ khám</th>
                <th className="py-3 px-5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-600">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
                    <p className="text-xs">Đang tải hồ sơ bệnh nhân...</p>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400">
                    <Users className="w-10 h-10 mx-auto text-gray-300 mb-2 stroke-[1.5]" />
                    <p className="text-sm font-medium text-gray-500">Không tìm thấy bệnh nhân nào</p>
                    <p className="text-xs text-gray-400 mt-0.5">Thử tìm kiếm với từ khóa khác hoặc bỏ bộ lọc</p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient, index) => {
                  const completedAppointments = patient.appointments?.filter((a) => a.isCompleted).length || 0;
                  const totalAppts = patient.appointments?.length || 0;
                  const resultsCount = patient.results?.length || 0;

                  return (
                    <tr key={patient._id || index} className="hover:bg-gray-50/70 transition-colors">
                      {/* Patient Name & Image */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={patient.image || 'https://via.placeholder.com/40'}
                            alt={patient.name}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200 bg-gray-50"
                          />
                          <div>
                            <p className="font-medium text-gray-900 leading-tight">{patient.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {patient.gender || 'Chưa cập nhật'} • {patient.dob ? formatDate(patient.dob) : 'Chưa có NS'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span>{patient.email || '-'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{patient.phone || 'Chưa cập nhật'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Appointments Stats */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-gray-900 text-xs">
                          {completedAppointments}/{totalAppts}
                        </span>
                        <p className="text-[11px] text-gray-400 mt-0.5">đã hoàn thành</p>
                      </td>

                      {/* Results Badge */}
                      <td className="py-3 px-4 text-center">
                        {resultsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            {resultsCount} kết quả
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-500">
                            Chưa có
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-5 text-center">
                        <button
                          onClick={() => {
                            setSelectedPatient(patient);
                            setActiveModalTab('overview');
                          }}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-indigo-600 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <img
                  src={selectedPatient.image || 'https://via.placeholder.com/80'}
                  alt={selectedPatient.name}
                  className="w-11 h-11 rounded-full object-cover border border-gray-200 bg-white"
                />
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{selectedPatient.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedPatient.email} {selectedPatient.phone && `• ${selectedPatient.phone}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 border-b border-gray-200 bg-white flex items-center gap-6 text-xs font-medium">
              <button
                onClick={() => setActiveModalTab('overview')}
                className={`py-3 border-b-2 transition-colors cursor-pointer ${
                  activeModalTab === 'overview'
                    ? 'border-indigo-600 text-indigo-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                Thông tin chung
              </button>
              <button
                onClick={() => setActiveModalTab('appointments')}
                className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'appointments'
                    ? 'border-indigo-600 text-indigo-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>Lịch sử khám</span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded-full font-mono">
                  {selectedPatient.appointments?.length || 0}
                </span>
              </button>
              <button
                onClick={() => setActiveModalTab('results')}
                className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === 'results'
                    ? 'border-indigo-600 text-indigo-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>Kết quả & Đơn thuốc</span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded-full font-mono">
                  {selectedPatient.results?.length || 0}
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Tab 1: Overview */}
              {activeModalTab === 'overview' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 border border-gray-200/80 rounded-lg p-4 text-xs">
                    <div>
                      <p className="text-gray-400 font-medium">Giới tính</p>
                      <p className="font-semibold text-gray-800 mt-1">{selectedPatient.gender || 'Chưa cập nhật'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Ngày sinh</p>
                      <p className="font-semibold text-gray-800 mt-1">{selectedPatient.dob ? formatDate(selectedPatient.dob) : 'Chưa cập nhật'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Tổng lịch hẹn</p>
                      <p className="font-semibold text-indigo-600 mt-1">{selectedPatient.appointments?.length || 0} cuộc hẹn</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Kết quả bệnh án</p>
                      <p className="font-semibold text-emerald-600 mt-1">{selectedPatient.results?.length || 0} kết quả</p>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Tóm tắt hoạt động gần nhất</h4>
                    {selectedPatient.appointments && selectedPatient.appointments.length > 0 ? (
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          Lịch hẹn gần nhất: <span className="font-medium text-gray-800">{slotDateFormat(selectedPatient.appointments[0]?.slotDate)}</span> ({selectedPatient.appointments[0]?.slotTime}) với bác sĩ <span className="font-medium text-gray-800">{selectedPatient.appointments[0]?.docData?.name}</span>
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">Chưa có hoạt động khám bệnh nào được ghi nhận</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Appointments */}
              {activeModalTab === 'appointments' && (
                <div>
                  {!selectedPatient.appointments || selectedPatient.appointments.length === 0 ? (
                    <div className="py-10 text-center text-gray-400">
                      <Calendar className="w-8 h-8 mx-auto text-gray-300 mb-2 stroke-[1.5]" />
                      <p className="text-xs">Chưa có lịch hẹn nào</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                      {selectedPatient.appointments.map((apt, idx) => (
                        <div key={idx} className="p-3.5 hover:bg-gray-50/60 transition-colors flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <img
                              src={apt.docData?.image || '/placeholder-doc.png'}
                              alt={apt.docData?.name}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200"
                            />
                            <div>
                              <p className="font-medium text-gray-900">{apt.docData?.name || 'Bác sĩ'}</p>
                              <p className="text-[11px] text-gray-400">{apt.docData?.speciality}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-gray-700 font-medium">
                              {slotDateFormat(apt.slotDate)} • {apt.slotTime}
                            </p>
                            <span className="mt-0.5 inline-block text-[11px]">
                              {apt.cancelled ? (
                                <span className="text-rose-600">Đã hủy</span>
                              ) : apt.isCompleted ? (
                                <span className="text-emerald-600 font-medium">Hoàn thành</span>
                              ) : (
                                <span className="text-indigo-600">Đang chờ khám</span>
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Results */}
              {activeModalTab === 'results' && (
                <div>
                  {!selectedPatient.results || selectedPatient.results.length === 0 ? (
                    <div className="py-10 text-center text-gray-400">
                      <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2 stroke-[1.5]" />
                      <p className="text-xs">Chưa có kết quả khám bệnh hoặc đơn thuốc nào</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedPatient.results.map((result, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white text-xs">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                            <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                              <Stethoscope className="w-4 h-4 text-indigo-500" />
                              Kết quả khám #{idx + 1}
                            </span>
                            <span className="text-gray-400 font-mono text-[11px]">
                              {formatDate(result.createdAt)}
                            </span>
                          </div>

                          <div className="mb-3 bg-gray-50 p-2.5 rounded border border-gray-100">
                            <p className="text-gray-500 font-medium mb-1">Chẩn đoán bác sĩ:</p>
                            <p className="text-gray-800 font-normal leading-relaxed">
                              {result.diagnosis || 'Không có ghi chú chẩn đoán'}
                            </p>
                          </div>

                          {result.prescription && result.prescription.length > 0 && (
                            <div>
                              <p className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                <Pill className="w-3.5 h-3.5 text-gray-400" />
                                Đơn thuốc đính kèm:
                              </p>
                              <div className="border border-gray-200 rounded overflow-hidden">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                                    <tr>
                                      <th className="py-1.5 px-3">Tên thuốc</th>
                                      <th className="py-1.5 px-3 text-center">Số lượng</th>
                                      <th className="py-1.5 px-3">Đơn vị</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {result.prescription.map((med, i) => (
                                      <tr key={i} className="hover:bg-gray-50/50">
                                        <td className="py-1.5 px-3 font-medium">{med.name || 'N/A'}</td>
                                        <td className="py-1.5 px-3 text-center tabular-nums">{med.quantity || 'N/A'}</td>
                                        <td className="py-1.5 px-3 text-gray-500">{med.unit || 'N/A'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/50 flex justify-end rounded-b-lg">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecords;
