import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'

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
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential)
      console.log("Google user:", decoded)

      // gửi token GG về backend để xử lý (tạo user nếu chưa có)
      const { data } = await axios.post(`${backendUrl}/api/user/google-login`, {
        credential: credentialResponse.credential
      })

      if (data.success) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
        toast.success("Login with Google successful")
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error("Google login failed")
      console.error(error)
    }
  }

  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token])

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg'>
        <p className='text-2xl font-semibold'>{state === 'Sign Up' ? "Tạo tài khoản" : "Đăng Nhập"}</p>
        <p>Vui lòng {state === 'Sign Up' ? "đăng ký" : "đăng nhập"} để đặt lịch hẹn</p>

        {state === 'Sign Up' &&
          <div className='w-full'>
            <p className='w-full'>Full Name</p>
            <input
              className='border border-zinc-300 rounded w-full p-2 mt-1 box-border'
              type="text"
              onChange={(e) => setName(e.target.value)}
              value={name}
              required
            />
          </div>
        }

        <div className='w-full'>
          <p className='w-full'>Email</p>
          <input
            className='border border-zinc-300 rounded w-full p-2 mt-1 box-border'
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />
        </div>

        <div className='w-full'>
          <p className='w-full'>Password</p>
          <input
            className='border border-zinc-300 rounded w-full p-2 mt-1 box-border'
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            required
          />
        </div>

        <button type='submit' className='bg-[#5f6FFF] text-white w-full py-2 rounded-md text-base cursor-pointer'>
          {state === 'Sign Up' ? "Đăng ký" : "Đăng nhập"}
        </button>

        {state === 'Sign Up'
          ? <p>Đã có tài khoản ? <span onClick={()=>setState('Login')} className='text-[#5f6FFF] underline cursor-pointer'>Đăng nhập</span></p>
          :<p>Tạo tài khoản mới ? <span onClick={()=>setState('Sign Up')} className='text-[#5f6FFF] underline cursor-pointer'>Đăng ký</span></p>
        }

        {/* Nút Google Login */}
        <div className='w-full flex justify-center mt-4'>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Google login failed")}
          />
        </div>
      </div>
    </form>
  )
}

export default Login