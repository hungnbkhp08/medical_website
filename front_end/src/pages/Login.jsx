import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import GoogleAuthButton from '../components/GoogleAuthButton'

const Login = () => {
  const { backendUrl, token, setToken } = useContext(AppContext)

  const [state, setState] = useState('Sign Up')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const navigate = useNavigate()

  // form login/signup thường
  const onSubmitHandler = async (event) => {
    event.preventDefault()
    try {
      if (state === 'Sign Up') {
        const { data } = await axios.post(`${backendUrl}/api/user/sign-up`, { name, email, password })
        if (data.success) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
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
  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token])

  return (
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
  )
}

export default Login