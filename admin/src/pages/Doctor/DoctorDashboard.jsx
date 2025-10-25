import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
const DoctorDashboard = () => {
    const { dToken, dashData, getDashboardData, setDashData, cancelAppointment, completeAppointment } = useContext(DoctorContext);
    const { slotDateFormat, currency } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('overview');
    const [filterPeriod, setFilterPeriod] = useState('month');

    useEffect(() => {
        getDashboardData();
    }, [dToken]);

    // Xử lý dữ liệu thống kê từ dashData
    const getChartData = () => {
        if (!dashData || !dashData.lastestAppointments) return [];
        
        // Thống kê theo ngày trong tuần
        const dayStats = {};
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        
        dashData.lastestAppointments.forEach(appointment => {
            const date = new Date(appointment.slotDate);
            const dayOfWeek = date.getDay();
            const dayName = dayNames[dayOfWeek];
            
            if (!dayStats[dayName]) {
                dayStats[dayName] = { name: dayName, appointments: 0, earnings: 0, patients: 0 };
            }
            dayStats[dayName].appointments++;
            dayStats[dayName].earnings += appointment.amount || 0;
            
            // Đếm bệnh nhân unique
            const patientIds = new Set();
            dashData.lastestAppointments.forEach(app => {
                const appDate = new Date(app.slotDate);
                if (appDate.getDay() === dayOfWeek) {
                    patientIds.add(app.userData._id);
                }
            });
            dayStats[dayName].patients = patientIds.size;
        });
        
        return Object.values(dayStats);
    };

    // Thống kê trạng thái lịch hẹn
    const getStatusStats = () => {
        if (!dashData || !dashData.lastestAppointments) return [];
        
        const stats = { completed: 0, pending: 0, cancelled: 0 };
        
        dashData.lastestAppointments.forEach(appointment => {
            if (appointment.cancelled) stats.cancelled++;
            else if (appointment.isCompleted) stats.completed++;
            else stats.pending++;
        });
        
        return [
            { name: 'Hoàn thành', value: stats.completed, color: '#10B981' },
            { name: 'Đang chờ', value: stats.pending, color: '#3B82F6' },
            { name: 'Đã hủy', value: stats.cancelled, color: '#EF4444' }
        ];
    };

    // Thống kê theo giờ trong ngày
    const getHourlyStats = () => {
        if (!dashData || !dashData.lastestAppointments) return [];
        
        const hourStats = {};
        
        dashData.lastestAppointments.forEach(appointment => {
            const hour = appointment.slotTime || '9:00';
            const hourKey = hour.split(':')[0] + ':00';
            
            if (!hourStats[hourKey]) {
                hourStats[hourKey] = { name: hourKey, appointments: 0 };
            }
            hourStats[hourKey].appointments++;
        });
        
        return Object.values(hourStats).sort((a, b) => 
            parseInt(a.name) - parseInt(b.name)
        );
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    };
    return dashData && (
        <div className='w-full max-w-[1400px] m-5'>
            {/* Header Stats */}
            <div className='flex flex-wrap gap-3 justify-center mb-8'>
                <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all shadow-sm'>
                    <img className='w-14' src={assets.earning_icon} alt="" />
                    <div>
                        <p className='text-xl font-semibold text-gray-600'>{formatCurrency(dashData.earnings)}</p>
                        <p className='text-gray-400'>Thu nhập</p>
                    </div>
                </div>
                <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all shadow-sm'>
                    <img className='w-14' src={assets.appointments_icon} alt="" />
                    <div>
                        <p className='text-xl font-semibold text-gray-600'>{dashData.appointments}</p>
                        <p className='text-gray-400'>Lịch hẹn</p>
                    </div>
                </div>
                <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all shadow-sm'>
                    <img className='w-14' src={assets.patients_icon} alt="" />
                    <div>
                        <p className='text-xl font-semibold text-gray-600'>{dashData.patients}</p>
                        <p className='text-gray-400'>Bệnh nhân</p>
                    </div>
                </div>
                <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all shadow-sm'>
                    <div className='w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center'>
                        <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
                        </svg>
                    </div>
                    <div>
                        <p className='text-xl font-semibold text-gray-600'>{dashData.lastestAppointments?.filter(apt => apt.isCompleted).length || 0}</p>
                        <p className='text-gray-400'>Đã hoàn thành</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className='bg-white rounded-lg border mb-6 shadow-sm'>
                <div className='flex border-b'>
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'overview' 
                                ? 'text-[#5F6FFF] border-b-2 border-[#5F6FFF]' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Tổng quan
                    </button>
                    <button
                        onClick={() => setActiveTab('charts')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'charts' 
                                ? 'text-[#5F6FFF] border-b-2 border-[#5F6FFF]' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Biểu đồ thống kê
                    </button>
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`px-6 py-3 font-medium transition-colors ${
                            activeTab === 'performance' 
                                ? 'text-[#5F6FFF] border-b-2 border-[#5F6FFF]' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Hiệu suất làm việc
                    </button>
                </div>
                {/* Tab Content */}
                <div className='p-6'>
                    {activeTab === 'overview' && (
                        <div className='bg-white'>
                            <div className='flex items-center gap-2.5 px-4 py-4 rounded-t border'>
                                <img src={assets.list_icon} alt="" />
                                <p className='font-semibold'>Lịch hẹn gần đây</p>
                            </div>
                            <div className='pt-4 border border-t-0'>
                                {
                                    dashData.lastestAppointments.map((item, index) => (
                                        <div className='flex items-center px-6 py-3 gap-3 hover:bg-gray-100' key={index}>
                                            <img className='rounded-full w-10' src={item.userData.image} alt="" />
                                            <div className='flex-1 text-sm'>
                                                <p className='text-gray-800 font-medium'>{item.userData.name}</p>
                                                <p className='text-gray-800'>{slotDateFormat(item.slotDate)}</p>
                                            </div>
                                            {
                                                item.cancelled ? (
                                                    <p className='text-red-400 text-xs font-medium'>Đã hủy</p>
                                                ) : item.isCompleted ? (
                                                    <p className='text-green-500 text-xs font-medium'>Hoàn thành</p>
                                                ) : (
                                                    <p className='text-blue-500 text-xs font-medium'>Đang chờ</p>
                                                )
                                            }
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    )}

                    {activeTab === 'charts' && (
                        <div className='space-y-6'>
                            {/* Filter */}
                            <div className='flex gap-4 mb-6'>
                                <select 
                                    value={filterPeriod} 
                                    onChange={(e) => setFilterPeriod(e.target.value)}
                                    className='border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5F6FFF]'
                                >
                                    <option value="week">Tuần này</option>
                                    <option value="month">Tháng này</option>
                                    <option value="year">Năm này</option>
                                </select>
                            </div>

                            <div className='space-y-8'>
                                {/* Biểu đồ lịch hẹn theo ngày - Full width */}
                                <div className='bg-white p-8 rounded-lg border shadow-sm'>
                                    <h3 className='text-xl font-semibold mb-6 text-gray-800'>Lịch hẹn theo ngày trong tuần</h3>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <AreaChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis 
                                                dataKey="name" 
                                                tick={{ fontSize: 12 }} 
                                                axisLine={{ stroke: '#d0d0d0' }}
                                                tickLine={{ stroke: '#d0d0d0' }}
                                            />
                                            <YAxis 
                                                tick={{ fontSize: 12 }} 
                                                axisLine={{ stroke: '#d0d0d0' }}
                                                tickLine={{ stroke: '#d0d0d0' }}
                                            />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: '#fff', 
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="appointments" 
                                                stroke="#5F6FFF" 
                                                fill="url(#colorAppointments)"
                                                strokeWidth={3}
                                            />
                                            <defs>
                                                <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#5F6FFF" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#5F6FFF" stopOpacity={0.1}/>
                                                </linearGradient>
                                            </defs>
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Row with 2 charts */}
                                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                                    {/* Biểu đồ thu nhập */}
                                    <div className='bg-white p-8 rounded-lg border shadow-sm'>
                                        <h3 className='text-xl font-semibold mb-6 text-gray-800'>Thu nhập theo ngày</h3>
                                        <ResponsiveContainer width="100%" height={400}>
                                            <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis 
                                                    dataKey="name" 
                                                    tick={{ fontSize: 12 }} 
                                                    axisLine={{ stroke: '#d0d0d0' }}
                                                    tickLine={{ stroke: '#d0d0d0' }}
                                                />
                                                <YAxis 
                                                    tick={{ fontSize: 12 }} 
                                                    axisLine={{ stroke: '#d0d0d0' }}
                                                    tickLine={{ stroke: '#d0d0d0' }}
                                                />
                                                <Tooltip 
                                                    formatter={(value) => [formatCurrency(value), 'Thu nhập']}
                                                    contentStyle={{ 
                                                        backgroundColor: '#fff', 
                                                        border: '1px solid #e0e0e0',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                    }}
                                                />
                                                <Bar 
                                                    dataKey="earnings" 
                                                    fill="#10B981" 
                                                    radius={[6, 6, 0, 0]}
                                                    maxBarSize={60}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Biểu đồ trạng thái lịch hẹn */}
                                    <div className='bg-white p-8 rounded-lg border shadow-sm'>
                                        <h3 className='text-xl font-semibold mb-6 text-gray-800'>Trạng thái lịch hẹn</h3>
                                        <ResponsiveContainer width="100%" height={400}>
                                            <PieChart>
                                                <Pie
                                                    data={getStatusStats()}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={120}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    stroke="#fff"
                                                    strokeWidth={2}
                                                >
                                                    {getStatusStats().map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: '#fff', 
                                                        border: '1px solid #e0e0e0',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Biểu đồ lịch hẹn theo giờ */}
                                <div className='bg-white p-8 rounded-lg border shadow-sm'>
                                    <h3 className='text-xl font-semibold mb-6 text-gray-800'>Lịch hẹn theo giờ trong ngày</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={getHourlyStats()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis 
                                                dataKey="name" 
                                                tick={{ fontSize: 12 }} 
                                                axisLine={{ stroke: '#d0d0d0' }}
                                                tickLine={{ stroke: '#d0d0d0' }}
                                            />
                                            <YAxis 
                                                tick={{ fontSize: 12 }} 
                                                axisLine={{ stroke: '#d0d0d0' }}
                                                tickLine={{ stroke: '#d0d0d0' }}
                                            />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: '#fff', 
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="appointments" 
                                                stroke="#F59E0B" 
                                                strokeWidth={4}
                                                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 6 }}
                                                activeDot={{ r: 8, stroke: '#F59E0B', strokeWidth: 2 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'performance' && (
                        <div className='space-y-6'>
                            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                                {/* Tỷ lệ hoàn thành */}
                                <div className='bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200'>
                                    <div className='flex items-center gap-4'>
                                        <div className='w-16 h-16 bg-green-500 rounded-full flex items-center justify-center'>
                                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className='text-2xl font-bold text-green-700'>
                                                {dashData.listAppointments 
                                                    ? Math.round((dashData.listAppointments.filter(apt => apt.isCompleted).length / dashData.listAppointments.length) * 100)
                                                    : 0}%
                                            </p>
                                            <p className='text-green-600 font-medium'>Tỷ lệ hoàn thành</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Bệnh nhân hài lòng */}
                                <div className='bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200'>
                                    <div className='flex items-center gap-4'>
                                        <div className='w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center'>
                                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12,17.5C14.33,17.5 16.3,16.04 17.11,14H6.89C7.69,16.04 9.67,17.5 12,17.5M8.5,11A1.5,1.5 0 0,0 10,9.5A1.5,1.5 0 0,0 8.5,8A1.5,1.5 0 0,0 7,9.5A1.5,1.5 0 0,0 8.5,11M15.5,11A1.5,1.5 0 0,0 17,9.5A1.5,1.5 0 0,0 15.5,8A1.5,1.5 0 0,0 14,9.5A1.5,1.5 0 0,0 15.5,11M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className='text-2xl font-bold text-blue-700'>{dashData.rating==0?'Chưa có dữ liệu':dashData.rating.toFixed(2)}%</p>
                                            <p className='text-blue-600 font-medium'>Bệnh nhân hài lòng</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Thu nhập trung bình */}
                                <div className='bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200'>
                                    <div className='flex items-center gap-4'>
                                        <div className='w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center'>
                                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className='text-2xl font-bold text-purple-700'>
                                                {formatCurrency(dashData.earnings / (dashData.listAppointments.filter(apt => apt.isCompleted).length || 1))}
                                            </p>
                                            <p className='text-purple-600 font-medium'>Thu nhập/lịch hẹn</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lời khuyên cải thiện */}
                            <div className='bg-white p-6 rounded-lg border shadow-sm'>
                                <h3 className='text-xl font-semibold mb-4 text-gray-800'>Gợi ý cải thiện hiệu suất</h3>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                    <div className='space-y-4'>
                                        <div className='flex items-start gap-3 p-4 bg-blue-50 rounded-lg'>
                                            <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0'>
                                                <span className='text-white text-sm font-bold'>1</span>
                                            </div>
                                            <div>
                                                <h4 className='font-medium text-blue-900 mb-1'>Tối ưu lịch làm việc</h4>
                                                <p className='text-sm text-blue-700'>Sắp xếp lịch hẹn vào khung giờ có nhiều bệnh nhân nhất</p>
                                            </div>
                                        </div>
                                        <div className='flex items-start gap-3 p-4 bg-green-50 rounded-lg'>
                                            <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0'>
                                                <span className='text-white text-sm font-bold'>2</span>
                                            </div>
                                            <div>
                                                <h4 className='font-medium text-green-900 mb-1'>Chăm sóc hậu mãi</h4>
                                                <p className='text-sm text-green-700'>Liên hệ theo dõi bệnh nhân sau điều trị</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='space-y-4'>
                                        <div className='flex items-start gap-3 p-4 bg-yellow-50 rounded-lg'>
                                            <div className='w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0'>
                                                <span className='text-white text-sm font-bold'>3</span>
                                            </div>
                                            <div>
                                                <h4 className='font-medium text-yellow-900 mb-1'>Nâng cao kỹ năng</h4>
                                                <p className='text-sm text-yellow-700'>Tham gia các khóa học để cập nhật kiến thức y khoa</p>
                                            </div>
                                        </div>
                                        <div className='flex items-start gap-3 p-4 bg-purple-50 rounded-lg'>
                                            <div className='w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0'>
                                                <span className='text-white text-sm font-bold'>4</span>
                                            </div>
                                            <div>
                                                <h4 className='font-medium text-purple-900 mb-1'>Giao tiếp hiệu quả</h4>
                                                <p className='text-sm text-purple-700'>Lắng nghe và giải thích rõ ràng cho bệnh nhân</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DoctorDashboard