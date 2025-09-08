import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import StarIcon from '@mui/icons-material/Star'
import StarHalfIcon from '@mui/icons-material/StarHalf'
import StarBorderIcon from '@mui/icons-material/StarBorder'

const TopDoctors = () => {
  const navigate = useNavigate()
  const { doctors } = useContext(AppContext)

  // Hàm render sao từ rating
  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)        
    const hasHalf = rating % 1 >= 0.5            
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIcon key={`full-${i}`} className="text-yellow-400" />)
    }
    if (hasHalf) {
      stars.push(<StarHalfIcon key="half" className="text-yellow-400" />)
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<StarBorderIcon key={`empty-${i}`} className="text-yellow-400" />)
    }

    return stars
  }

  return (
    <div className='flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10'>
      <h1 className='text-3xl font-medium'>Bác sĩ nổi bật bạn có thể đặt lịch</h1>
      <p className='sm:w-1/3 text-center text-sm'>Dễ dàng duyệt qua danh sách bác sĩ uy tín của chúng tôi.</p>
      <div className='w-full grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 pt-5 gap-y-6 px-3 sm:px-0 '>
        {doctors.slice(0, 12).map((item, index) => (
          <div
            onClick={() => {
              navigate(`/appointment/${item._id}`);
              scrollTo(0, 0);
            }}
            className='border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500'
            key={index}
          >
            <img className='bg-blue-50' src={item.image} alt="" />
            <div className='p-4'>
              <div className='flex items-center gap-2 text-sm text-center'>
                {item.available ? (
                  <>
                    <p className='w-2 h-2 bg-green-500 rounded-full'></p>
                    <p className='text-green-600'>Đang làm việc</p>
                  </>
                ) : (
                  <>
                    <p className='w-2 h-2 bg-red-500 rounded-full'></p>
                    <p className='text-red-600'>Tạm nghỉ</p>
                  </>
                )}
              </div>
              <p className='text-gray-900 text-lg font-medium'>{item.name}</p>
              <p className='text-gray-600 text-sm'>{item.speciality}</p>

              {/* Rating */}
              {item.averageRating !== undefined && (
                <div className="flex items-center gap-1 mt-2">
                  {renderStars(item.averageRating)}
                  <span className="text-sm text-gray-600">
                    {item.averageRating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          navigate(`/doctors`);
          scrollTo(0, 0);
        }}
        className='bg-blue-50 text-gray-600 px-12 py-3 rounded-full mt-10 cursor-pointer'
      >
        Xem thêm
      </button>
    </div>
  )
}

export default TopDoctors