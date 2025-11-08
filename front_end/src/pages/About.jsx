import React from 'react'
import { assets } from '../assets/assets'

const About = () => {
  return (
    <div>
      {/* --- GIỚI THIỆU --- */}
      <div className='text-center text-2xl pt-10 text-gray-500'>
        <p> GIỚI THIỆU <span className='text-gray-700 font-medium'>CHÚNG TÔI</span></p>
      </div>

      {/* --- PHẦN GIỚI THIỆU CHUNG --- */}
      <div className='my-10 flex flex-col md:flex-row gap-12'>
        <img className='w-full md:max-w-[360px]' src={assets.about_image} alt="About" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600'>
          <p>
            Chào mừng bạn đến với <b>hệ thống đặt lịch khám trực tuyến</b> – người bạn đồng hành đáng tin cậy giúp bạn dễ dàng tiếp cận các dịch vụ y tế một cách nhanh chóng và thuận tiện. 
            Chúng tôi hiểu rằng việc sắp xếp lịch khám và quản lý thông tin sức khỏe có thể mất nhiều thời gian và phức tạp, vì vậy hệ thống này được xây dựng để giúp bạn đơn giản hóa mọi bước.
          </p>
          <p>
            Nền tảng của chúng tôi không ngừng được cải tiến với mục tiêu mang lại trải nghiệm tốt nhất cho người dùng. 
            Với giao diện thân thiện và công nghệ hiện đại, bạn có thể dễ dàng đặt lịch, tra cứu bác sĩ, và theo dõi lịch sử khám của mình chỉ với vài thao tác.
          </p>
          <b className='text-gray-800'>Tầm nhìn của chúng tôi</b>
          <p>
            Chúng tôi hướng đến việc xây dựng một hệ sinh thái chăm sóc sức khỏe thông minh, nơi bệnh nhân và bác sĩ được kết nối dễ dàng hơn bao giờ hết. 
            Tầm nhìn của hệ thống là tạo ra một trải nghiệm y tế liền mạch, nhanh chóng và đáng tin cậy cho tất cả mọi người.
          </p>
        </div>
      </div>

      {/* --- TẠI SAO CHỌN CHÚNG TÔI --- */}
      <div className='text-xl my-4 px-4'>
        <p> TẠI SAO <span className='text-gray-700 font-semibold'>CHỌN CHÚNG TÔI</span></p>
      </div>

      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-20 px-4'>
        <div className='border px-10 py-8 flex flex-col gap-5 text-[15px] hover:bg-[#5f6FFF] hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>HIỆU QUẢ:</b>
          <p>Đặt lịch khám nhanh chóng, tiết kiệm thời gian và dễ dàng theo dõi lịch hẹn.</p>
        </div>

        <div className='border px-10 py-8 flex flex-col gap-5 text-[15px] hover:bg-[#5f6FFF] hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>TIỆN LỢI:</b>
          <p>Kết nối trực tiếp với đội ngũ bác sĩ, phòng khám uy tín trong khu vực của bạn.</p>
        </div>

        <div className='border px-10 py-8 flex flex-col gap-5 text-[15px] hover:bg-[#5f6FFF] hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>CÁ NHÂN HÓA:</b>
          <p>Gợi ý, nhắc nhở và lưu trữ thông tin sức khỏe cá nhân để theo dõi dễ dàng.</p>
        </div>
      </div>
    </div>
  )
}

export default About