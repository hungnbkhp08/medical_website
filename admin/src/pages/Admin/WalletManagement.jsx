import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Wallet, 
  History, 
  Search, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Unlock, 
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Calendar
} from 'lucide-react';

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
  const [historyLoading, setHistoryLoading] = useState(false);

  // Lấy danh sách tất cả ví
  const getAllWallets = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        backendUrl + '/api/wallet/get-all-wallets',
        { headers: { aToken } }
      );
      if (data.success) {
        setWallets(data.wallets || []);
        setFilteredWallets(data.wallets || []);
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
      setHistoryLoading(true);
      setShowHistoryModal(true);
      const { data } = await axios.post(
        backendUrl + '/api/wallet/get-wallet-history-admin',
        { docId },
        { headers: { aToken } }
      );
      if (data.success) {
        setWalletHistory(data.history || []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải lịch sử giao dịch');
    } finally {
      setHistoryLoading(false);
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

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (wallet) =>
          wallet.doctor?.name?.toLowerCase().includes(term) ||
          wallet.doctor?.speciality?.toLowerCase().includes(term) ||
          wallet.doctor?.email?.toLowerCase().includes(term)
      );
    }

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

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalBalance = wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
  const activeCount = wallets.filter((w) => w.status === 'active').length;
  const inactiveCount = wallets.filter((w) => w.status === 'inactive').length;

  return (
    <div className="w-full max-w-7xl m-5 pr-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Quản lý ví bác sĩ</h1>
          <p className="text-xs text-gray-500 mt-0.5">Theo dõi số dư, trạng thái tài khoản và lịch sử nạp tiền của bác sĩ</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-medium text-gray-500">Tổng số ví</p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">{wallets.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600">
            <Wallet className="w-5 h-5 text-gray-700" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-medium text-gray-500">Đang hoạt động</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-semibold text-gray-800">{activeCount}</span>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">Bình thường</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-medium text-gray-500">Tạm khóa</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-semibold text-gray-800">{inactiveCount}</span>
              {inactiveCount > 0 && (
                <span className="text-xs text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-medium">Cần lưu ý</span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-medium text-gray-500">Tổng số dư hệ thống</p>
            <p className="text-xl font-semibold text-indigo-600 mt-1">
              {totalBalance.toLocaleString('vi-VN')} <span className="text-xs text-gray-500 font-normal">VNĐ</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3.5 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên bác sĩ, chuyên khoa..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-gray-800 text-white'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Tất cả ({wallets.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterStatus === 'active'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Hoạt động ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterStatus === 'inactive'
                ? 'bg-rose-600 text-white'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Đã khóa ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Bác sĩ</th>
                <th className="py-3 px-4">Chuyên khoa</th>
                <th className="py-3 px-4 text-right">Số dư ví</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-5 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-600">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
                    <p className="text-xs">Đang tải danh sách ví...</p>
                  </td>
                </tr>
              ) : filteredWallets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400">
                    <Wallet className="w-10 h-10 mx-auto text-gray-300 mb-2 stroke-[1.5]" />
                    <p className="text-sm font-medium text-gray-500">Không tìm thấy ví nào</p>
                    <p className="text-xs text-gray-400 mt-0.5">Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc</p>
                  </td>
                </tr>
              ) : (
                filteredWallets.map((wallet) => (
                  <tr key={wallet._id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Doctor Info */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={wallet.doctor?.image || '/placeholder-doc.png'}
                          alt={wallet.doctor?.name || 'Doctor'}
                          className="w-9 h-9 rounded-full object-cover border border-gray-200 bg-gray-50"
                        />
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">
                            {wallet.doctor?.name || 'Không xác định'}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{wallet.doctor?.email || '-'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Speciality */}
                    <td className="py-3 px-4">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-medium">
                        {wallet.doctor?.speciality || 'Chưa cập nhật'}
                      </span>
                    </td>

                    {/* Balance */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-gray-900 tabular-nums">
                        {(wallet.balance || 0).toLocaleString('vi-VN')}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">VNĐ</span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {wallet.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Đã khóa
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedWallet(wallet);
                            getWalletHistory(wallet.docId);
                          }}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer font-medium"
                          title="Xem lịch sử giao dịch"
                        >
                          <History className="w-3.5 h-3.5 text-gray-500" />
                          <span>Lịch sử</span>
                        </button>

                        <button
                          onClick={() => changeWalletStatus(wallet.docId, wallet.status)}
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer font-medium ${
                            wallet.status === 'active'
                              ? 'border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700'
                              : 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                          title={wallet.status === 'active' ? 'Khóa ví bác sĩ' : 'Mở khóa ví bác sĩ'}
                        >
                          {wallet.status === 'active' ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Khóa</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Mở</span>
                            </>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 rounded-t-lg">
              <div>
                <h3 className="text-base font-semibold text-gray-800">Lịch sử giao dịch nạp tiền</h3>
                {selectedWallet?.doctor && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Bác sĩ: <span className="font-medium text-gray-700">{selectedWallet.doctor.name}</span> • Chuyên khoa: {selectedWallet.doctor.speciality}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedWallet(null);
                  setWalletHistory([]);
                }}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1">
              {historyLoading ? (
                <div className="py-12 text-center text-gray-400">
                  <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
                  <p className="text-xs">Đang tải lịch sử giao dịch...</p>
                </div>
              ) : walletHistory.length === 0 ? (
                <div className="py-10 text-center text-gray-400">
                  <History className="w-9 h-9 mx-auto text-gray-300 mb-2 stroke-[1.5]" />
                  <p className="text-sm font-medium text-gray-600">Chưa có giao dịch nạp tiền nào</p>
                  <p className="text-xs text-gray-400 mt-0.5">Các giao dịch phát sinh sẽ được hiển thị tại đây</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-4">#</th>
                        <th className="py-2.5 px-4">Số tiền nạp</th>
                        <th className="py-2.5 px-4">Thời gian</th>
                        <th className="py-2.5 px-4 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-600">
                      {walletHistory.map((item, index) => (
                        <tr key={item._id || index} className="hover:bg-gray-50/60">
                          <td className="py-2.5 px-4 font-mono text-gray-400">
                            #{walletHistory.length - index}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-emerald-600">
                            +{Number(item.amount).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-2.5 px-4 text-gray-500">
                            {formatDate(item.date || item.createdAt)}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
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

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50/50 flex justify-end rounded-b-lg">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedWallet(null);
                  setWalletHistory([]);
                }}
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

export default WalletManagement;
