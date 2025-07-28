import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const MyAppointments = () => {
  const { backendUrl, token, getDoctorData } = useContext(AppContext)
  const [appointments, setAppointments] = useState([])

  const months = [
    " ", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ]

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split('_')
    return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
  }

  const getUserAppointment = async () => {
    try {
      const { data } = await axios.post(backendUrl + '/api/user/appointments', {}, { headers: { token } })
      if (data.success) {
        setAppointments(data.appointments.reverse())
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(backendUrl + '/api/user/cancel-appointments', { appointmentId }, { headers: { token } })
      if (data.success) {
        toast.success(data.message)
        getUserAppointment()
        getDoctorData()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const payAppointment = async (appointmentId, amount) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/payment/create-payment',
        {
          orderId: appointmentId,
          amount: amount,
          orderInfo: `Thanh toán cho lịch hẹn ${appointmentId}`
        },
        { headers: { token } }
      )

      if (data.success && data.payUrl) {
        localStorage.setItem('appointmentId', appointmentId)
        window.location.href = data.payUrl
      } else {
        toast.error("Không tạo được thanh toán")
      }
    } catch (error) {
      toast.error("Lỗi tạo thanh toán: " + error.message)
    }
  }

  useEffect(() => {
    if (token) {
      getUserAppointment()
    }
  }, [token])

  return (
    <div>
      <p className='pb-3 mt-12 font-medium text-zinc-700 border-b'>Lịch hẹn của tôi</p>
      <div>
        {appointments.map((item, index) => (
          <div className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b' key={index}>
            <div>
              <img className='w-32 bg-indigo-50' src={item.docData.image} alt="" />
            </div>
            <div className='flex-1 text-sm text-zinc-600'>
              <p className='text-neutral-800 font-semibold'>{item.docData.name}</p>
              <p>{item.docData.speciality}</p>
              <p className='text-zinc-700 font-medium mt-1'>Địa chỉ:</p>
              <p className='text-xs'>{item.docData.address.line1}</p>
              <p className='text-xs'>{item.docData.address.line2}</p>
              <p className='text-xs mt-1'>
                <span className='text-sm text-neutral-700 font-medium'>Ngày & Giờ:</span> {slotDateFormat(item.slotDate)} | {item.slotTime}
              </p>
            </div>
            <div></div>
            <div className='flex flex-col gap-2 justify-end'>
              <div className='flex flex-col gap-2 justify-end'>
                {item.payment ? (
                  <button className='sm:min-w-48 py-2 border border-green-600 rounded text-green-600'>
                    Đã thanh toán
                  </button>
                ) : (
                  !item.cancelled && !item.isCompleted && (
                    <>
                      <button
                        onClick={() => payAppointment(item._id, item.docData.fees)}
                        className='text-sm text-stone-500 sm:min-w-48 py-2 border hover:bg-[#5f6FFF] hover:text-white transition-all duration-300 cursor-pointer'>
                        Thanh toán online
                      </button>
                      <button
                        onClick={() => cancelAppointment(item._id)}
                        className='text-sm text-stone-500 sm:min-w-48 py-2 border hover:bg-red-600 hover:text-white transition-all duration-300 cursor-pointer'>
                        Hủy lịch hẹn
                      </button>
                    </>
                  )
                )}

                {item.cancelled && !item.isCompleted && (
                  <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500'>
                    Đã hủy lịch hẹn
                  </button>
                )}
                {item.isCompleted && (
                  <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500'>
                    Đã hoàn thành
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyAppointments
