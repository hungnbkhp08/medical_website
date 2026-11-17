import React, { useContext, useEffect } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';

const AllAppointments = () => {
  const { aToken, appointments, getAllAppointment, cancelAppointment, confirmPayment } = useContext(AdminContext);
  const { caculateAge, slotDateFormat, currency } = useContext(AppContext);

  useEffect(() => {
    if (aToken) {
      getAllAppointment();
    }
  }, [aToken]);

  return (
    <div className='w-full max-w-6xl m-5'>
      <p className='mb-3 text-lg font-medium'>Tất cả lịch hẹn</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] min-h-[60vh] overflow-y-scroll'>
        <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1.5fr] grid-flow-col py-3 px-6 border-b'>
          <p>#</p>
          <p>Bệnh nhân</p>
          <p>Tuổi</p>
          <p>Ngày & Giờ</p>
          <p>Bác sĩ</p>
          <p>Phí</p>
          <p>Hành động</p>
        </div>
        {appointments.map((item, index) => (
          <div className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1.5fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
            <p className='max-sd:hidden'>{index + 1}</p>
            <div className='flex items-center gap-2'>
              <img className='w-8 rounded-full' src={item.userData.image} alt="" /> <p>{item.userData.name}</p>
            </div>
            <p className='max-sd:hidden'>{caculateAge(item.userData.dob)}</p>
            <p>{slotDateFormat(item.slotDate)},{item.slotTime}</p>
            <div className='flex items-center gap-2'>
              <img className='w-8 rounded-full bg-gray-200' src={item.docData.image} alt="" /> <p>{item.docData.name}</p>
            </div>
            <p>{currency}{item.amount}</p>
            {
              item.cancelled ? (
                <p className='text-red-400 text-xs font-medium'>Đã hủy</p>
              ) : item.isCompleted ? (
                <p className='text-green-500 text-xs font-medium'>Hoàn thành</p>
              ) : item.payment ? (
                <p className='text-blue-500 text-xs font-medium'>Đã thanh toán</p>
              ) : (
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => confirmPayment(item._id)}
                    className='text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-1 px-2.5 rounded shadow-sm transition-all duration-200 cursor-pointer whitespace-nowrap'
                    title='Xác nhận thanh toán thành công'
                  >
                    Xác nhận TT
                  </button>
                  <img
                    onClick={() => cancelAppointment(item._id)}
                    className='w-8 cursor-pointer hover:opacity-80 transition-opacity'
                    src={assets.cancel_icon}
                    alt="Hủy"
                    title="Hủy lịch hẹn"
                  />
                </div>
              )
            }

          </div>
        ))}
      </div>
    </div>
  );
};

export default AllAppointments;
