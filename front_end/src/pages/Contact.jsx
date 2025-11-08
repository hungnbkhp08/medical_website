import React from 'react'
import { assets } from '../assets/assets'

const Contact = () => {
  return (
    <div>
      {/* --- TIÊU ĐỀ --- */}
      <div className='text-center text-2xl pt-10 text-gray-500'>
        <p>LIÊN HỆ <span className='text-gray-700 font-semibold'>CHÚNG TÔI</span></p>
      </div>

      {/* --- NỘI DUNG LIÊN HỆ --- */}
      <div className='my-10 flex flex-col justify-center md:flex-row gap-10 mb-28 text-sm'>
        <img
          className='w-full md:max-w-[360px]'
          src={assets.contact_image}
          alt="Contact"
        />

        <div className='flex flex-col justify-center items-start gap-6'>
          <p className='font-semibold text-lg text-gray-600'>VĂN PHÒNG CỦA CHÚNG TÔI</p>
          <p className='text-gray-600'>Hải Phòng</p>

          <p className='text-gray-600'>
            <b>Điện thoại:</b> 0368 874 207 <br />
            <b>Email:</b> hungdepzaihehe@gmail.com
          </p>

          <p className='text-gray-600'>
            Nếu bạn có thắc mắc hoặc cần hỗ trợ, vui lòng liên hệ với chúng tôi qua thông tin trên.
            Chúng tôi luôn sẵn sàng hỗ trợ bạn trong thời gian sớm nhất.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Contact
