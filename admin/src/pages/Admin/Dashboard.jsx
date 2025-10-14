import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../../assets/assets';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
const Dashboard = () => {
  const { aToken, dashData, getDashData, cancelAppointment } = useContext(AdminContext);
  const { slotDateFormat } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterPeriod, setFilterPeriod] = useState('month');

  useEffect(() => {
    if (aToken) {
      getDashData();
    }
  }, [aToken]);

  // Xử lý dữ liệu thống kê từ dashData
  const getChartData = () => {
    if (!dashData || !dashData.latestAppointments) return [];
    
    // Thống kê theo ngày trong tuần
    const dayStats = {};
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    
    dashData.latestAppointments.forEach(appointment => {
      const date = new Date(appointment.slotDate);
      const dayOfWeek = date.getDay();
      const dayName = dayNames[dayOfWeek];
      
      if (!dayStats[dayName]) {
        dayStats[dayName] = { name: dayName, appointments: 0, revenue: 0 };
      }
      dayStats[dayName].appointments++;
      dayStats[dayName].revenue += appointment.amount || 0;
    });
    
    return Object.values(dayStats);
  };

  // Thống kê trạng thái lịch hẹn
  const getStatusStats = () => {
    if (!dashData || !dashData.latestAppointments) return [];
    
    const stats = { completed: 0, pending: 0, cancelled: 0 };
    
    dashData.latestAppointments.forEach(appointment => {
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
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all '>
          <img className='w-14' src={assets.doctor_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.doctors}</p>
            <p className='text-gray-400'>Bác sĩ</p>
          </div>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all '>
          <img className='w-14' src={assets.appointments_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.appointments}</p>
            <p className='text-gray-400'>Lịch hẹn</p>
          </div>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all '>
          <img className='w-14' src={assets.patients_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.patients}</p>
            <p className='text-gray-400'>Bệnh nhân</p>
          </div>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all '>
          <div className='w-14 h-14 bg-green-100 rounded-full flex items-center justify-center'>
            <span className='text-2xl'>💰</span>
          </div>
          <div>
            <p className='text-xl font-semibold text-gray-600'>{formatCurrency(dashData.totalEarnings)}</p>
            <p className='text-gray-400'>Doanh thu</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className='bg-white rounded-lg border mb-6'>
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
            onClick={() => setActiveTab('top-performers')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'top-performers' 
                ? 'text-[#5F6FFF] border-b-2 border-[#5F6FFF]' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Top lịch khám
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
                  dashData.latestAppointments.map((item, index) => (
                    <div className='flex items-center px-6 py-3 gap-3 hover:bg-gray-100' key={index}>
                      <img className='rounded-full w-10' src={item.docData.image} alt="" />
                      <div className='flex-1 text-sm'>
                        <p className='text-gray-800 font-medium'>{item.docData.name}</p>
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
                  <h3 className='text-xl font-semibold mb-6 text-gray-800'>Lịch hẹn </h3>
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
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="appointments" 
                        fill="#5F6FFF" 
                        radius={[6, 6, 0, 0]}
                        maxBarSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Row with 2 charts */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                  {/* Biểu đồ doanh thu */}
                  <div className='bg-white p-8 rounded-lg border shadow-sm'>
                    <h3 className='text-xl font-semibold mb-6 text-gray-800'>Doanh thu theo ngày</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                          formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#10B981" 
                          strokeWidth={4}
                          dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Biểu đồ tròn trạng thái */}
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
              </div>
            </div>
          )}

          {activeTab === 'top-performers' && (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Bác sĩ có nhiều lịch hẹn nhất */}
              <div className='bg-white p-6 rounded-lg border'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold'>Bác sĩ nhiều lịch hẹn nhất</h3>
                  <select className='border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F6FFF]'>
                    <option value="month">Tháng này</option>
                    <option value="week">Tuần này</option>
                    <option value="day">Hôm nay</option>
                  </select>
                </div>
                
                {dashData.doctorMostAppointments && dashData.doctorMostAppointments.length > 0 ? (
                  <div className='space-y-3'>
                    {dashData.doctorMostAppointments.map((item, index) => {
                      const rankColors = [
                        { bg: 'from-yellow-50 to-yellow-100', border: 'border-yellow-200', text: 'text-yellow-600', badge: 'bg-yellow-500' },
                        { bg: 'from-gray-50 to-gray-100', border: 'border-gray-200', text: 'text-gray-600', badge: 'bg-gray-500' },
                        { bg: 'from-orange-50 to-orange-100', border: 'border-orange-200', text: 'text-orange-600', badge: 'bg-orange-500' }
                      ];
                      const color = rankColors[index] || rankColors[2];
                      
                      return (
                        <div key={item.doctor._id} className={`flex items-center gap-4 p-4 bg-gradient-to-r ${color.bg} rounded-lg border ${color.border}`}>
                          <img 
                            src={item.doctor.image} 
                            alt="" 
                            className={`w-12 h-12 rounded-full object-cover border-2 ${color.border}`}
                          />
                          <div className='flex-1'>
                            <h4 className='font-semibold text-gray-800'>{item.doctor.name}</h4>
                            <p className='text-xs text-gray-600'>{item.doctor.speciality}</p>
                            <p className={`text-sm font-bold ${color.text} mt-1`}>{item.count} lịch hẹn</p>
                          </div>
                          <div className='text-right'>
                            <div className={`${color.badge} text-white px-2 py-1 rounded-full text-xs font-medium`}>
                              #{index + 1}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className='text-center py-8 text-gray-500'>
                    Chưa có dữ liệu bác sĩ
                  </div>
                )}
              </div>

              {/* Bệnh nhân có nhiều lịch hẹn nhất */}
              <div className='bg-white p-6 rounded-lg border'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold'>Bệnh nhân nhiều lịch hẹn nhất</h3>
                  <select className='border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F6FFF]'>
                    <option value="month">Tháng này</option>
                    <option value="week">Tuần này</option>
                    <option value="day">Hôm nay</option>
                  </select>
                </div>
                
                {dashData.patientsMostAppointments && dashData.patientsMostAppointments.length > 0 ? (
                  <div className='space-y-3'>
                    {dashData.patientsMostAppointments.map((item, index) => {
                      const rankColors = [
                        { bg: 'from-yellow-50 to-yellow-100', border: 'border-yellow-200', text: 'text-yellow-600', badge: 'bg-yellow-500' },
                        { bg: 'from-gray-50 to-gray-100', border: 'border-gray-200', text: 'text-gray-600', badge: 'bg-gray-500' },
                        { bg: 'from-orange-50 to-orange-100', border: 'border-orange-200', text: 'text-orange-600', badge: 'bg-orange-500' }
                      ];
                      const color = rankColors[index] || rankColors[2];
                      
                      return (
                        <div key={item.user._id} className={`flex items-center gap-4 p-4 bg-gradient-to-r ${color.bg} rounded-lg border ${color.border}`}>
                          <img 
                            src={item.user.image || '/api/placeholder/48/48'} 
                            alt="" 
                            className={`w-12 h-12 rounded-full object-cover border-2 ${color.border}`}
                          />
                          <div className='flex-1'>
                            <h4 className='font-semibold text-gray-800'>{item.user.name}</h4>
                            <p className='text-xs text-gray-600'>{item.user.email}</p>
                            <p className={`text-sm font-bold ${color.text} mt-1`}>{item.count} lịch hẹn</p>
                          </div>
                          <div className='text-right'>
                            <div className={`${color.badge} text-white px-2 py-1 rounded-full text-xs font-medium`}>
                              #{index + 1}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className='text-center py-8 text-gray-500'>
                    Chưa có dữ liệu bệnh nhân
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard