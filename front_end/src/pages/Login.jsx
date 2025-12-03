import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import GoogleAuthButton from '../components/GoogleAuthButton'

const Login = () => {
  const { backendUrl, token, setToken } = useContext(AppContext)

  const [state, setState] = useState('Sign Up')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showOtpPopup, setShowOtpPopup] = useState(false)
  const [otp, setOtp] = useState('')
  const [tempEmail, setTempEmail] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const navigate = useNavigate()

  // form login/signup thường
  const onSubmitHandler = async (event) => {
    event.preventDefault()
    try {
      if (state === 'Sign Up') {
        const { data } = await axios.post(`${backendUrl}/api/user/sign-up`, { name, email, password })
        if (data.success) {
          // Không lưu token ngay, hiển thị popup OTP
          setTempEmail(email)
          setShowOtpPopup(true)
          toast.success('Mã OTP đã được gửi đến email của bạn!')
          // Reset form
          setName('')
          setEmail('')
          setPassword('')
        } else {
          toast.error(data.message)
        }
      } else {
        const { data } = await axios.post(`${backendUrl}/api/user/login`, { email, password })
        if (data.success) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
        } else {
          toast.error(data.message)
        }
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Xác thực OTP
  const verifyOtpHandler = async (e) => {
    e.preventDefault()
    
    if (!otp || otp.length !== 6) {
      toast.error('Vui lòng nhập mã OTP 6 số')
      return
    }

    setIsVerifying(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/verify-login-otp`, { 
        email: tempEmail, 
        otp 
      })
      
      if (data.success) {
        // Không lưu token, chỉ thông báo thành công và chuyển sang đăng nhập
        toast.success('Xác thực thành công! Vui lòng đăng nhập.')
        setShowOtpPopup(false)
        setOtp('')
        setState('Login') // Chuyển sang form đăng nhập
        setEmail(tempEmail) // Tự động điền email
        setTempEmail('')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setIsVerifying(false)
    }
  }

  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token, navigate])

  return (
    <>
      <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center justify-center py-10'>
        <div className='flex flex-col gap-4 m-auto items-start p-8 sm:p-10 min-w-[340px] sm:min-w-[450px] border rounded-2xl text-zinc-600 text-sm shadow-xl bg-white'>
        {/* Header */}
        <div className='w-full text-center mb-2'>
          <p className='text-3xl font-bold text-gray-800 mb-2'>
            {state === 'Sign Up' ? "Tạo tài khoản" : "Chào mừng trở lại"}
          </p>
          <p className='text-gray-600'>
            {state === 'Sign Up' 
              ? "Tạo tài khoản để bắt đầu đặt lịch hẹn với bác sĩ" 
              : "Đăng nhập để tiếp tục sử dụng dịch vụ"
            }
          </p>
        </div>

        {state === 'Sign Up' &&
          <div className='w-full'>
            <p className='font-medium mb-2 text-gray-700'>Họ và tên</p>
            <input
              className='border border-gray-300 rounded-lg w-full p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#5f6FFF] focus:border-transparent transition-all'
              type="text"
              onChange={(e) => setName(e.target.value)}
              value={name}
              placeholder='Nhập họ và tên của bạn'
              required
            />
          </div>
        }

        <div className='w-full'>
          <p className='font-medium mb-2 text-gray-700'>Email</p>
          <input
            className='border border-gray-300 rounded-lg w-full p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#5f6FFF] focus:border-transparent transition-all'
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            placeholder='example@email.com'
            required
          />
        </div>

        <div className='w-full'>
          <p className='font-medium mb-2 text-gray-700'>Mật khẩu</p>
          <input
            className='border border-gray-300 rounded-lg w-full p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#5f6FFF] focus:border-transparent transition-all'
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            placeholder='Nhập mật khẩu'
            required
          />
        </div>

        <button 
          type='submit' 
          className='bg-[#5f6FFF] text-white w-full py-3 rounded-lg text-base font-medium cursor-pointer hover:bg-[#4f5fef] transition-all shadow-md hover:shadow-lg mt-2'
        >
          {state === 'Sign Up' ? "Đăng ký" : "Đăng nhập"}
        </button>

        <div className='w-full text-center'>
          {state === 'Sign Up'
            ? <p className='text-gray-600'>
                Đã có tài khoản? {' '}
                <span 
                  onClick={() => setState('Login')} 
                  className='text-[#5f6FFF] font-medium underline cursor-pointer hover:text-[#4f5fef] transition-colors'
                >
                  Đăng nhập ngay
                </span>
              </p>
            : <p className='text-gray-600'>
                Chưa có tài khoản? {' '}
                <span 
                  onClick={() => setState('Sign Up')} 
                  className='text-[#5f6FFF] font-medium underline cursor-pointer hover:text-[#4f5fef] transition-colors'
                >
                  Đăng ký ngay
                </span>
              </p>
          }
        </div>

        {/* Nút Google Login */}
        <GoogleAuthButton
          type={state === 'Sign Up' ? 'signup' : 'login'}
          backendUrl={backendUrl}
          setToken={setToken}
        />
      </div>
    </form>

    {/* OTP Popup Modal */}
    {showOtpPopup && (
     <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
        <div className='bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fadeIn'>
          <div className='text-center mb-6'>
            <div className='bg-[#5f6FFF] bg-opacity-10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
              <svg className='w-8 h-8 text-[#5f6FFF]' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <h2 className='text-2xl font-bold text-gray-800 mb-2'>Xác thực OTP</h2>
            <p className='text-gray-600'>
              Mã OTP đã được gửi đến email <br/>
              <span className='font-semibold text-[#5f6FFF]'>{tempEmail}</span>
            </p>
          </div>

          <form onSubmit={verifyOtpHandler} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Nhập mã OTP (6 số)
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className='w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f6FFF] focus:border-transparent transition-all'
                maxLength={6}
                required
              />
              <p className='text-xs text-gray-500 mt-2'>
                ⏱️ Mã OTP có hiệu lực trong 10 phút
              </p>
            </div>

            <div className='flex gap-3'>
              <button
                type='button'
                onClick={() => {
                  setShowOtpPopup(false)
                  setOtp('')
                  setState('Sign Up')
                }}
                className='flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-all'
                disabled={isVerifying}
              >
                Hủy
              </button>
              <button
                type='submit'
                className='flex-1 bg-[#5f6FFF] text-white py-3 rounded-lg font-medium hover:bg-[#4f5fef] transition-all shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed'
                disabled={isVerifying || otp.length !== 6}
              >
                {isVerifying ? (
                  <span className='flex items-center justify-center gap-2'>
                    <svg className='animate-spin h-5 w-5' viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Đang xác thực...
                  </span>
                ) : (
                  'Xác nhận'
                )}
              </button>
            </div>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-sm text-gray-600'>
              Không nhận được mã? {' '}
              <button
                type='button'
                onClick={() => toast.info('Tính năng gửi lại OTP đang phát triển')}
                className='text-[#5f6FFF] font-medium hover:underline'
              >
                Gửi lại
              </button>
            </p>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default Login