import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Wallet, History, Eye, ToggleLeft, ToggleRight, Search, X } from 'lucide-react';

const WalletManagement = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const [wallets, setWallets] = useState([]);
  const [filteredWallets, setFilteredWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletHistory, setWalletHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Lấy danh sách tất cả ví
  const getAllWallets = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        backendUrl + '/api/wallet/get-all-wallets',
        { headers: { aToken } }
      );
      if (data.success) {
        setWallets(data.wallets);
        setFilteredWallets(data.wallets);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải danh sách ví');
    } finally {
      setLoading(false);
    }
  };

  // Lấy lịch sử giao dịch của ví
  const getWalletHistory = async (docId) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/wallet/get-wallet-history-admin',
        { docId },
        { headers: { aToken } }
      );
      if (data.success) {
        setWalletHistory(data.history || []);
        setShowHistoryModal(true);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải lịch sử giao dịch');
    }
  };

  // Đổi trạng thái ví
  const changeWalletStatus = async (docId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const { data } = await axios.post(
        backendUrl + '/api/wallet/change-wallet-status',
        { docId, status: newStatus },
        { headers: { aToken } }
      );
      if (data.success) {
        toast.success(`Ví đã ${newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} thành công`);
        getAllWallets();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể thay đổi trạng thái ví');
    }
  };

  // Filter wallets
  useEffect(() => {
    let filtered = wallets;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (wallet) =>
          wallet.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          wallet.doctor?.speciality?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((wallet) => wallet.status === filterStatus);
    }

    setFilteredWallets(filtered);
  }, [searchTerm, filterStatus, wallets]);

  useEffect(() => {
    if (aToken) {
      getAllWallets();
    }
  }, [aToken]);

  const formatDate = (date) =>
    new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#5F6FFF]"></div>
//       </div>
//     );
//   }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý ví</h1>
        <p className="text-gray-600 text-sm mt-1">Quản lý tất cả ví của bác sĩ trong hệ thống</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-semibold">Tổng số ví</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{wallets.length}</h3>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <Wallet className="w-8 h-8 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-semibold">Đang hoạt động</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">
                {wallets.filter((w) => w.status === 'active').length}
              </h3>
            </div>
            <div className="bg-green-200 p-3 rounded-xl">
              <ToggleRight className="w-8 h-8 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-semibold">Bị khóa</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">
                {wallets.filter((w) => w.status === 'inactive').length}
              </h3>
            </div>
            <div className="bg-red-200 p-3 rounded-xl">
              <ToggleLeft className="w-8 h-8 text-red-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-semibold">Tổng số dư</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">
                {wallets.reduce((sum, w) => sum + (w.balance || 0), 0).toLocaleString('vi-VN')} đ
              </h3>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <Wallet className="w-8 h-8 text-purple-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên bác sĩ hoặc chuyên khoa..."
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#5F6FFF] focus:outline-none transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                filterStatus === 'all'
                  ? 'bg-[#5F6FFF] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                filterStatus === 'active'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Hoạt động
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                filterStatus === 'inactive'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Bị khóa
            </button>
          </div>
        </div>
      </div>

      {/* Wallets Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Bác sĩ</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Chuyên khoa</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Số dư</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredWallets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      {searchTerm || filterStatus !== 'all'
                        ? 'Không tìm thấy ví nào'
                        : 'Chưa có ví nào trong hệ thống'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredWallets.map((wallet) => (
                  <tr key={wallet._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={wallet.doctor?.image}
                          alt={wallet.doctor?.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                        />
                        <div>
                          <p className="font-semibold text-gray-800">{wallet.doctor?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{wallet.doctor?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{wallet.doctor?.speciality || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-[#5F6FFF] text-lg">
                        {wallet.balance?.toLocaleString('vi-VN')} đ
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          wallet.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {wallet.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedWallet(wallet);
                            getWalletHistory(wallet.docId);
                          }}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                          title="Xem lịch sử"
                        >
                          <History className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => changeWalletStatus(wallet.docId, wallet.status)}
                          className={`p-2 rounded-lg transition-all ${
                            wallet.status === 'active'
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-green-100 text-green-600 hover:bg-green-200'
                          }`}
                          title={wallet.status === 'active' ? 'Khóa ví' : 'Mở khóa ví'}
                        >
                          {wallet.status === 'active' ? (
                            <ToggleLeft className="w-5 h-5" />
                          ) : (
                            <ToggleRight className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Lịch sử giao dịch</h2>
                {selectedWallet?.doctor && (
                  <p className="text-gray-600 text-sm mt-1">
                    Bác sĩ: {selectedWallet.doctor.name} - {selectedWallet.doctor.speciality}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedWallet(null);
                  setWalletHistory([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {walletHistory.length === 0 ? (
                <div className="py-12 text-center">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Chưa có giao dịch nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">STT</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Số tiền</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Thời gian</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {walletHistory.map((item, index) => (
                        <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-gray-700">#{walletHistory.length - index}</td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-green-600 text-lg">
                              +{item.amount.toLocaleString('vi-VN')} đ
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{formatDate(item.date)}</td>
                          <td className="px-6 py-4">
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                              Thành công
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletManagement;
