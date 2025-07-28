import React from 'react'
import { assets } from '../assets/assets'

const About = () => {
  return (
    <div>
      <div className='text-center text-2xl pt-10 text-gray-500'>
        <p> GIỚI THIỆU <span className='text-gray-700 font-medium'>CHÚNG TÔI</span></p>
      </div>
      <div className='my-10 flex flex-col md:flex-row gap-12'>
        <img className='w-full md:max-w-[360px]' src={assets.about_image} alt="" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600'>
          <p>Chào mừng bạn đến với Prescripto, người bạn đồng hành đáng tin cậy trong việc quản lý nhu cầu chăm sóc sức khỏe một cách tiện lợi và hiệu quả. Tại Prescripto, chúng tôi thấu hiểu những khó khăn mà mọi người gặp phải trong việc đặt lịch khám và quản lý hồ sơ sức khỏe.</p>
          <p>Prescripto cam kết mang đến sự xuất sắc trong công nghệ y tế. Chúng tôi liên tục nâng cấp nền tảng, tích hợp các công nghệ tiên tiến nhất để cải thiện trải nghiệm người dùng và cung cấp dịch vụ vượt trội. Dù bạn đang đặt lịch hẹn đầu tiên hay đang quản lý việc điều trị lâu dài, Prescripto luôn đồng hành cùng bạn trên mọi chặng đường.</p>
          <b className='text-gray-800'>Tầm nhìn của chúng tôi</b>
          <p>Tầm nhìn của Prescripto là tạo ra một trải nghiệm chăm sóc sức khỏe liền mạch cho mọi người. Chúng tôi mong muốn thu hẹp khoảng cách giữa bệnh nhân và nhà cung cấp dịch vụ y tế, giúp bạn dễ dàng tiếp cận dịch vụ khi cần thiết.</p>
        </div>
      </div>
      <div className='text-xl my-4 px-4'>
        <p> TẠI SAO <span className='text-gray-700 font-semibold'>CHỌN CHÚNG TÔI</span></p>
      </div>
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-20 px-4'>
        <div className='border px-10 py-8 flex flex-col gap-5 text-[15px] hover:bg-[#5f6FFF] hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>HIỆU QUẢ:</b>
          <p>Đặt lịch khám nhanh chóng, phù hợp với lối sống bận rộn của bạn.</p>
        </div>
        <div className='border px-10 py-8 flex flex-col gap-5 text-[15px] hover:bg-[#5f6FFF] hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>TIỆN LỢI:</b>
          <p>Truy cập mạng lưới bác sĩ uy tín tại khu vực của bạn.</p>
        </div>
        <div className='border px-10 py-8 flex flex-col gap-5 text-[15px] hover:bg-[#5f6FFF] hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>CÁ NHÂN HÓA:</b>
          <p>Gợi ý và nhắc nhở phù hợp để bạn luôn theo sát sức khỏe của mình.</p>
        </div>
      </div>

    </div>
  )
}

export default About
