import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import StarIcon from '@mui/icons-material/Star'
import StarHalfIcon from '@mui/icons-material/StarHalf'
import StarBorderIcon from '@mui/icons-material/StarBorder'

const RelatedDoctors = ({ speciality, docId }) => {
  const { doctors } = useContext(AppContext)
  const navigate = useNavigate()
  const [relDoc, setRelDocs] = useState([])
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
  useEffect(() => {
    if (doctors.length > 0 && speciality) {
      const doctorsData = doctors.filter(doc => doc.speciality === speciality && doc._id !== docId)
      setRelDocs(doctorsData)
    }
  }, [doctors, speciality, docId])

  return (
    <div className='flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10'>
      <h1 className='text-3xl font-medium'>Bác sĩ nổi bật bạn có thể đặt lịch</h1>
      <p className='sm:w-1/3 text-center text-sm'>Dễ dàng duyệt qua danh sách bác sĩ uy tín của chúng tôi.</p>
      
      <div className='w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 pt-5 px-3 sm:px-0'>
        {relDoc.slice(0, 5).map((item, index) => (
          <div 
            onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }} 
            className='border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] hover:shadow-lg transition-all duration-500 bg-white shadow-sm hover:border-[#5f6FFF] relative'
            key={index}
          >
            <div className="relative">
              <img 
                className='bg-blue-50 w-full h-64 object-cover' 
                src={item.image} 
                alt={item.name}
              />
              {/* Badge trạng thái */}
              <div className="absolute top-3 right-3">
                {item.available ? (
                  <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    Sẵn sàng
                  </div>
                ) : (
                  <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    Bận
                  </div>
                )}
              </div>
            </div>
            
            <div className='p-4'>
              <div className='mb-3'>
                <h3 className='text-gray-900 text-lg font-semibold mb-1'>{item.name}</h3>
                <p className='text-[#5f6FFF] text-sm font-medium'>{item.speciality}</p>
              </div>
              
              {/* Rating */}
              {item.averageRating !== undefined && item.averageRating > 0 ? (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5">
                    {renderStars(item.averageRating)}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {item.averageRating.toFixed(1)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <StarBorderIcon key={i} className="text-gray-300 text-sm" />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Trạng thái làm việc */}
              <div className='flex items-center gap-2 text-sm'>
                {item.available ? (
                  <>
                    <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                    <span className='text-green-600 font-medium'>Đang làm việc</span>
                  </>
                ) : (
                  <>
                    <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                    <span className='text-red-600 font-medium'>Tạm nghỉ</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#5f6FFF]/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => { navigate(`/doctors`); scrollTo(0, 0) }} 
        className='bg-[#5f6FFF] text-white px-12 py-3 rounded-full mt-10 cursor-pointer hover:bg-[#4f5fef] transition-colors shadow-md hover:shadow-lg'
      >
        Xem thêm
      </button>
    </div>
  )
}

export default RelatedDoctors
