import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Wallet, TrendingUp, Clock, DollarSign, CreditCard, History } from 'lucide-react';
import momo from '../../assets/momo.webp';

const DoctorWallet = () => {
    const { dToken, backendUrl } = useContext(DoctorContext);
    const [walletData, setWalletData] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [topupAmount, setTopupAmount] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    const getWalletData = async () => {
        try {
            setLoading(true);
            const { data } = await axios.post(
                backendUrl + '/api/wallet/get-wallet-balance',
                {},
                { headers: { dToken } }
            );
            if (data.success) setWalletData(data);
            else toast.error(data.message);
        } catch {
            toast.error('Không thể tải thông tin ví');
        } finally {
            setLoading(false);
        }
    };

    const getWalletHistory = async () => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/wallet/get-wallet-history',
                {},
                { headers: { dToken } }
            );
            if (data.success) setHistory(data.history || []);
            else toast.error(data.message);
        } catch {
            toast.error('Không thể tải lịch sử giao dịch');
        }
    };

    const handleTopup = async () => {
        if (!topupAmount || topupAmount <= 0) return toast.error('Vui lòng nhập số tiền hợp lệ');
        try {
            const { data } = await axios.post(
                backendUrl + '/api/payment/create-payment-for-wallet',
                { amount: Number(topupAmount) },
                { headers: { dToken } }
            );
            if (data.success && data.payUrl) window.location.href = data.payUrl;
            else toast.error(data.message || 'Không thể tạo thanh toán');
        } catch {
            toast.error('Có lỗi xảy ra khi tạo thanh toán');
        }
    };

    useEffect(() => {
        if (dToken) {
            getWalletData();
            getWalletHistory();
        }
    }, [dToken]);

    const formatDate = (date) =>
        new Date(date).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

    // if (loading)
    //     return (
    //         <div className="flex items-center justify-center h-screen">
    //             <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#5F6FFF]"></div>
    //         </div>
    //     );

    return (
        <div className="p-6">
            {/* Header - Góc trên trái */}
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-800">Quản lý ví</h1>
                <p className="text-gray-600 text-sm mt-1">Theo dõi số dư và lịch sử giao dịch của bạn</p>
            </div>

            {/* Wallet info - Full width */}
            <div className="bg-gradient-to-br from-[#5F6FFF] to-[#4F5FEF] rounded-2xl p-6 text-white shadow-xl mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-xl">
                            <Wallet className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-white/80 text-sm">Số dư ví hiện tại</p>
                            <h2 className="text-4xl font-bold mt-1">
                                {walletData?.balance?.toLocaleString('vi-VN')} VNĐ
                            </h2>
                        </div>
                    </div>

                    {walletData?.doctor && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="flex items-center gap-4">
                                <img
                                    src={walletData.doctor.image}
                                    alt={walletData.doctor.name}
                                    className="w-14 h-14 rounded-full border-4 border-white/30"
                                />
                                <div>
                                    <h3 className="font-semibold text-lg">{walletData.doctor.name}</h3>
                                    <p className="text-white/80 text-sm">{walletData.doctor.speciality}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setActiveTab('topup')}
                        className="bg-white text-[#5F6FFF] px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center gap-2 shadow-lg"
                    >
                        <CreditCard className="w-5 h-5" />
                        Nạp tiền
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                {[
                    { key: 'overview', label: 'Tổng quan', icon: Wallet },
                    { key: 'topup', label: 'Nạp tiền', icon: CreditCard },
                    { key: 'history', label: 'Lịch sử', icon: History }
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`pb-3 px-6 font-semibold transition-all flex items-center gap-2 ${activeTab === key
                                ? 'border-b-2 border-[#5F6FFF] text-[#5F6FFF]'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Icon className="w-5 h-5" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab Content Area - Fixed height to prevent layout shift */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ minHeight: '600px' }}>
                <div className="relative h-full">
                    {/* Tổng quan */}
                    {activeTab === 'overview' && (
                        <div className="p-8 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <StatBox
                                    color="green"
                                    icon={TrendingUp}
                                    title="Tổng nạp"
                                    value={`${history.reduce((s, i) => s + i.amount, 0).toLocaleString('vi-VN')} VNĐ`}
                                />
                                <StatBox
                                    color="blue"
                                    icon={Clock}
                                    title="Giao dịch"
                                    value={history.length}
                                />
                                <StatBox
                                    color="purple"
                                    icon={DollarSign}
                                    title="Trung bình/lần"
                                    value={
                                        history.length > 0
                                            ? `${Math.round(
                                                history.reduce((s, i) => s + i.amount, 0) / history.length
                                            ).toLocaleString('vi-VN')} VNĐ`
                                            : '0 VNĐ'
                                    }
                                />
                            </div>
                        </div>
                    )}

                    {/* Nạp tiền */}
                    {activeTab === 'topup' && (
                        <div className="p-8 animate-fadeIn">
                            <div className="max-w-4xl mx-auto">
                                <div className="text-center mb-8">
                                    <div className="bg-[#5F6FFF]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CreditCard className="w-10 h-10 text-[#5F6FFF]" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Nạp tiền vào ví</h2>
                                    <p className="text-gray-600">Chọn hoặc nhập số tiền bạn muốn nạp</p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                    {[100000, 200000, 500000, 1000000, 2000000, 5000000].map((amount) => (
                                        <button
                                            key={amount}
                                            onClick={() => setTopupAmount(amount.toString())}
                                            className={`p-4 rounded-xl border-2 transition-all font-semibold ${topupAmount === amount.toString()
                                                    ? 'border-[#5F6FFF] bg-[#5F6FFF]/10 text-[#5F6FFF]'
                                                    : 'border-gray-200 hover:border-[#5F6FFF]/50 text-gray-700'
                                                }`}
                                        >
                                            {(amount / 1000).toLocaleString('vi-VN')}K
                                        </button>
                                    ))}
                                </div>

                                <div className="mb-6">
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        Hoặc nhập số tiền khác
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={topupAmount}
                                            onChange={(e) => setTopupAmount(e.target.value)}
                                            placeholder="Nhập số tiền (VNĐ)"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#5F6FFF] focus:outline-none transition-all"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                                            VNĐ
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-blue-800 flex items-center gap-1">
                                        <img src={momo} alt="MoMo Logo" className="w-5 h-5 object-contain" />
                                        Thanh toán qua <strong>MoMo</strong> – An toàn và nhanh chóng
                                    </p>
                                </div>

                                <button
                                    onClick={handleTopup}
                                    disabled={!topupAmount || topupAmount <= 0}
                                    className="w-full bg-[#5F6FFF] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#4F5FEF] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <CreditCard className="w-6 h-6" />
                                    Tiến hành nạp tiền
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Lịch sử */}
                    {activeTab === 'history' && (
                        <div className="p-8 animate-fadeIn">
                            {history.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <History className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 text-lg">Chưa có giao dịch nào</p>
                                    <p className="text-gray-400 text-sm mt-2">Hãy nạp tiền lần đầu tiên!</p>
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
                                            {history.map((item, index) => (
                                                <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 text-gray-700">#{history.length - index}</td>
                                                    <td className="px-6 py-4 font-bold text-green-600 text-lg">
                                                        +{item.amount.toLocaleString('vi-VN')} VNĐ
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
                    )}
                </div>
            </div>
        </div>
    );
};

const StatBox = ({ color, icon: Icon, title, value }) => (
    <div
        className={`bg-gradient-to-br from-${color}-50 to-${color}-100 p-6 rounded-xl border border-${color}-200`}
    >
        <div className="flex flex-col items-center text-center">
            <div className={`bg-${color}-200 p-3 rounded-xl mb-3`}>
                <Icon className={`w-6 h-6 text-${color}-700`} />
            </div>
            <p className="text-gray-600 text-sm mb-2">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        </div>
    </div>
);

export default DoctorWallet;
