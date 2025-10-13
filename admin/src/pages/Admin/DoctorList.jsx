import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { useNavigate } from 'react-router-dom'

const DoctorList = () => {
   const {doctors,aToken,getAllDoctors,changeAvailability}= useContext(AdminContext)
   const navigate = useNavigate()
   
   useEffect(() => {
    if (aToken) {
      getAllDoctors();
    }
  }, [aToken]);
  
  return (
    <div className='m-5 max-h-[90vh] overflow-y-scroll'>
      <h1 className='text-lg font-medium'>Bác sỹ</h1>
      <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
        {
          doctors.map((item,index)=>(
            <div className='border border-indigo-200 rounded-xl max-w-56 overflow-hidden cursor-pointer group' key={index}>
              <div onClick={() => navigate(`/doctor-detail/${item._id}`)}>
                <img className='border-indigo-50 group-hover:bg-[#5f6FFF] transition-all duration-500' src={item.image} alt=""/>
                <div className='p-4'>
                  <p className='text-neutral-800 text-lg font-medium'>{item.name}</p>
                  <p className='text-zinc-600 text-sm'>{item.speciality}</p>
                  <p className='text-zinc-500 text-xs mt-1'>{item.experience} năm kinh nghiệm</p>
                </div>
              </div>
              <div className='px-4 pb-4'>
                <div className='flex items-center gap-1 text-sm'>
                  <input 
                    onChange={(e) => {
                      e.stopPropagation();
                      changeAvailability(item._id);
                    }} 
                    type='checkbox' 
                    checked={item.available}
                  />
                  <p>Đang hoạt động</p>
                </div>
                <button
                  onClick={() => navigate(`/doctor-detail/${item._id}`)}
                  className='w-full mt-3 py-2 px-4 bg-[#5F6FFF] text-white text-sm rounded-lg hover:bg-[#4F5FEF] transition'
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default DoctorList