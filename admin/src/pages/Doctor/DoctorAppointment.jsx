import React, { use, useEffect } from 'react'
import { useContext } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets'
const DoctorAppointment = () => {
    const { getAppointments, appointments, dToken, completeAppointment, cancelAppointment } = useContext(DoctorContext);
    const { caculateAge, slotDateFormat, currency } = useContext(AppContext)
    useEffect(() => {
        if (dToken) {
            getAppointments();
        }
    }
        , [dToken]);
    return (
        <div className='w-full max-w-6xl m-5'>
            <p className='mb-3 text-lg font-medium'>All Appointments</p>

            <div className='bg-white border rounded text-sm max-h-[80vh] min-h-[60vh] overflow-y-scroll'>
                <div className='hidden sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
                    <p>#</p>
                    <p>Patient</p>
                    <p>Payment</p>
                    <p>Age</p>
                    <p>Date & Time</p>
                    <p>Fee</p>
                    <p>Action</p>
                </div>
                {
                    appointments.reverse().map((item, index) => (
                        <div className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
                            <p className='max-sd:hidden'>{index + 1}</p>
                            <div className='flex items-center gap-2'>
                                <img className='w-8 rounded-full' src={item.userData.image} alt="" /> <p>{item.userData.name}</p>
                            </div>
                            <p className='text-xs inline border px-2 rounded-full w-fit'>{item.payment ? 'Online' : 'CASH'}</p>
                            <p className='max-sd:hidden'>{caculateAge(item.userData.dob)}</p>
                            <p>{slotDateFormat(item.slotDate)},{item.slotTime}</p>
                            <p>{currency}{item.amount}</p>
                            {
                                item.cancelled ? (
                                    <p className='text-red-400 text-xs font-medium'>Cancelled</p>
                                ) : item.payment ? (
                                    <p className='text-blue-500 text-xs font-medium'>Paid</p>
                                ) : item.isCompleted ? (
                                    <p className='text-green-500 text-xs font-medium'>Completed</p>
                                ) : (
                                    <div className='flex'>
                                        <img
                                            onClick={() => cancelAppointment(item._id)}
                                            className='w-10 cursor-pointer'
                                            src={assets.cancel_icon}
                                            alt=""
                                        />
                                        <img
                                            onClick={() => completeAppointment(item._id)}
                                            className='w-10 cursor-pointer'
                                            src={assets.tick_icon}
                                            alt=""
                                        />
                                    </div>
                                )
                            }

                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default DoctorAppointment