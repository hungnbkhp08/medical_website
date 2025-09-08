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

  const applyFilter = () => {
    if (speciality) {
      // Lọc trực tiếp theo tên chuyên khoa tiếng Việt từ URL
      setFilterDoc(doctors.filter(doc => doc.speciality === decodeURIComponent(speciality)));
    } else {
      setFilterDoc(doctors);
    }
  };

  useEffect(() => {
    applyFilter();
  }, [doctors, speciality]);

  return (
    <div>
      <p className='text-gray-600'>Tìm bác sĩ theo chuyên khoa.</p>
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
        <div className='w-full grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 gap-y-6'>
          {
            filterDoc.map((item, index) => (
              <div
                onClick={() => navigate(`/appointment/${item._id}`)}
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
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default Doctors;
