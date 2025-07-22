import { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../context/AppContext'

const PaymentSuccess = () => {
    const { backendUrl, token, getDoctorData } = useContext(AppContext)
  const navigate = useNavigate()

  useEffect(() => {
    const updatePaymentStatus = async () => {
        // dùng tạm để lấy appointmentId từ localStorage
      const appointmentId = localStorage.getItem('appointmentId')
      if (!appointmentId) return

      try {
        const { data } = await axios.post(backendUrl + '/api/user/paid-appointments', { appointmentId }, { headers: { token } })
        toast.success('Đã cập nhật trạng thái thanh toán!')
      } catch (err) {
        console.error('❌ Lỗi cập nhật thanh toán:', err)
        toast.error('Cập nhật thanh toán thất bại')
      } finally {
        // Xóa appointmentId sau khi xử lý để tránh update lại nếu reload
        localStorage.removeItem('appointmentId')
        // Chuyển trang sau delay
        setTimeout(() => {
          navigate('/my-appointments')
        }, 1500)
      }
    }

    updatePaymentStatus()
  }, [navigate])

  return (
    <div className='text-center mt-20 text-green-600'>
      <h2 className='text-2xl font-bold'>Thanh toán thành công!</h2>
      <p className='mt-4'>Đang chuyển hướng bạn về lịch hẹn...</p>
    </div>
  )
}

export default PaymentSuccess