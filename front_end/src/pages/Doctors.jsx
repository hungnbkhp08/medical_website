import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import StarIcon from '@mui/icons-material/Star';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import StarBorderIcon from '@mui/icons-material/StarBorder';

const Doctors = () => {
  const { speciality } = useParams();
  const navigate = useNavigate();
  const [filterDoc, setFilterDoc] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { doctors } = useContext(AppContext);
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
    let filtered = doctors;

    // Lọc theo chuyên khoa
    if (speciality) {
      filtered = filtered.filter(doc => doc.speciality === decodeURIComponent(speciality));
    }

    // Lọc theo tên bác sĩ
    if (searchQuery.trim()) {
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilterDoc(filtered);
  }, [doctors, speciality, searchQuery]);

  return (
    <div>
      <p className='text-gray-600'>Tìm bác sĩ theo chuyên khoa.</p>
      
      {/* Search Bar */}
      <div className='mt-5 mb-5'>
        <div className='relative max-w-xl'>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bác sĩ theo tên..."
            className='w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f6FFF] focus:border-transparent transition-all'
          />
          <svg 
            className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400'
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
            >
              <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className='text-sm text-gray-500 mt-2'>
            Tìm thấy <span className='font-semibold text-[#5f6FFF]'>{filterDoc.length}</span> bác sĩ
          </p>
        )}
      </div>

      <div className='flex flex-col sm:flex-row items-start gap-5 mt-5'>
        <button
          className={`py-1 px-2 border rounded text-sm transition-all sm:hidden ${showFilter ? 'bg-[#5f6FFF] text-white' : ''}`}
          onClick={() => setShowFilter(prev => !prev)}
        >
          Filters
        </button>
        <div className={`flex flex-col gap-4 text-sm text-gray-600 ${showFilter ? 'flex' : 'hidden sm:flex'} sm:block sm:w-1/4`}>
          <p onClick={() => navigate('/doctors/Bác sĩ đa khoa')} className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Bác sĩ đa khoa" ? "bg-indigo-100 text-black" : ""}`}>Bác sĩ đa khoa</p>
          <p onClick={() => navigate('/doctors/Bác sĩ phụ khoa')} className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Bác sĩ phụ khoa" ? "bg-indigo-100 text-black" : ""}`}>Bác sĩ phụ khoa</p>
          <p onClick={() => navigate('/doctors/Bác sĩ da liễu')} className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Bác sĩ da liễu" ? "bg-indigo-100 text-black" : ""}`}>Bác sĩ da liễu</p>
          <p onClick={() => navigate('/doctors/Bác sĩ nhi khoa')} className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Bác sĩ nhi khoa" ? "bg-indigo-100 text-black" : ""}`}>Bác sĩ nhi khoa</p>
          <p onClick={() => navigate('/doctors/Bác sĩ thần kinh')} className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Bác sĩ thần kinh" ? "bg-indigo-100 text-black" : ""}`}>Bác sĩ thần kinh</p>
          <p onClick={() => navigate('/doctors/Bác sĩ tiêu hóa')} className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Bác sĩ tiêu hóa" ? "bg-indigo-100 text-black" : ""}`}>Bác sĩ tiêu hóa</p>
        </div>
        <div className='w-full'>
          {filterDoc.length === 0 ? (
            // Trường hợp không có bác sĩ
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="bg-gray-100 rounded-full p-6 mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy bác sĩ</h3>
              <p className="text-gray-500 text-center max-w-md">
                {speciality 
                  ? `Hiện tại chưa có bác sĩ nào thuộc chuyên khoa ${decodeURIComponent(speciality)}.` 
                  : 'Hiện tại chưa có bác sĩ nào trong hệ thống.'
                }
              </p>
              {speciality && (
                <button
                  onClick={() => navigate('/doctors')}
                  className="mt-4 px-6 py-2 bg-[#5f6FFF] text-white rounded-lg hover:bg-[#4f5fef] transition-colors"
                >
                  Xem tất cả bác sĩ
                </button>
              )}
            </div>
          ) : (
            // Grid responsive cho các trường hợp khác
            <div className={`
              ${filterDoc.length === 1 
                ? 'flex justify-start' 
                : filterDoc.length === 2 
                ? 'grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl' 
                : filterDoc.length === 3 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              }
            `}>
              {filterDoc.map((item, index) => (
                <div
                  onClick={() => navigate(`/appointment/${item._id}`)}
                  className={`
                    border border-blue-200 rounded-xl overflow-hidden cursor-pointer 
                    hover:translate-y-[-10px] hover:shadow-lg transition-all duration-500
                    bg-white shadow-sm hover:border-[#5f6FFF]
                    ${filterDoc.length === 1 ? 'w-80' : 'w-full'}
                  `}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Doctors;
