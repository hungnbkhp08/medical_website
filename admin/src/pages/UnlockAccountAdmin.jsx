import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShieldCheck, ShieldAlert, Loader } from 'lucide-react';

const UnlockAccountAdmin = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState('');

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        const unlockAccount = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setLoading(false);
                setSuccess(false);
                setMessage('Link không hợp lệ');
                return;
            }

            try {
                const { data } = await axios.post(`${backendUrl}/api/admin/unlock-account`, {  token });

                if (data.success) {
                    setSuccess(true);
                    setMessage(data.message);
                    toast.success('Mở khóa tài khoản thành công!');
                    
                    // Chuyển về trang login sau 3 giây
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                } else {
                    setSuccess(false);
                    setMessage(data.message);
                    toast.error(data.message);
                }
            } catch (error) {
                setSuccess(false);
                setMessage('Có lỗi xảy ra. Vui lòng thử lại.');
                toast.error('Có lỗi xảy ra');
            } finally {
                setLoading(false);
            }
        };

        unlockAccount();
    }, [searchParams, navigate, backendUrl]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                {loading ? (
                    <div className="text-center">
                        <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Đang xử lý...
                        </h2>
                        <p className="text-gray-600">
                            Vui lòng chờ trong giây lát
                        </p>
                    </div>
                ) : success ? (
                    <div className="text-center">
                        <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                            <ShieldCheck className="w-12 h-12 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Thành công!
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {message}
                        </p>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-green-800">
                                 Bạn sẽ được chuyển đến trang đăng nhập trong 3 giây...
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all"
                        >
                            Đăng nhập ngay
                        </button>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="bg-red-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                            <ShieldAlert className="w-12 h-12 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Thất bại!
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {message}
                        </p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-red-800">
                                 Link có thể đã hết hạn hoặc không hợp lệ
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all"
                        >
                            Về trang đăng nhập
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnlockAccountAdmin;