import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const DoctorProfile = () => {
  const { dToken, getProfileData, profileData, setProfileData, backendUrl } = useContext(DoctorContext);
  const { currency } = useContext(AppContext);
  const [isEdit, setIsEdit] = useState(false);
  const updateProfile = async () => {
    try {
      const updateData = {
        address: profileData.address,
        fees: profileData.fees,
        available: profileData.available,
      }
      const { data } = await axios.post(backendUrl + '/api/doctor/update-profile',  updateData , { headers: { dToken } });
      if (data.success) {
        toast.success(data.message);
        setIsEdit(false);
        getProfileData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message)
    }
  };
  useEffect(() => {
    if (dToken) {
      getProfileData();
    }
  }, [dToken]);

  return profileData && (
    <div className='p-5'>
      {/* Ảnh đại diện */}
      <div className='flex justify-center mb-6'>
        <img
          className='bg-[#5f6FFF]/80 w-full sm:max-w-64 rounded-lg shadow-md'
          src={profileData.image}
          alt="Doctor"
        />
      </div>

      {/* Thông tin chính */}
      <div className='border border-stone-200 rounded-lg p-6 bg-white shadow-sm'>
        <h2 className='text-xl font-semibold mb-2'>{profileData.name}</h2>
        <div className="flex items-center gap-3 mb-2">
          <p className='text-gray-700'>
            {profileData.degree} - {profileData.speciality}
          </p>
          <p className='py-0.5 px-2 border text-xs rounded-full text-gray-600'>
            {profileData.experience}
          </p>
        </div>


        {/* Giới thiệu */}
        <div className='mb-4'>
          <p className='font-medium'>About:</p>
          <p className='text-gray-600'>{profileData.about}</p>
        </div>

        {/* Phí khám */}
        <div className='mb-4'>
          <p className='font-medium'>
            Appointment fee:
            {
              isEdit ? (
                <span className='ml-2 text-blue-600'>
                  {currency}
                  <input
                    type="number"
                    className='ml-1 border px-2 py-1 rounded w-24'
                    onChange={(e) => setProfileData(prev => ({ ...prev, fees: e.target.value }))}
                    value={profileData.fees}
                  />
                </span>
              ) : (
                <span className='ml-2 text-blue-600'>
                  {currency} {profileData.fees}
                </span>
              )
            }
          </p>
        </div>


        {/* Địa chỉ */}
        <div className='mb-4'>
          <p className='font-medium mb-1'>Address:</p>
          {
            isEdit ? (
              <div className='flex flex-col gap-2'>
                <input
                  type="text"
                  className='border px-3 py-1 rounded text-sm'
                  value={profileData.address.line1}
                  onChange={(e) =>
                    setProfileData(prev => ({
                      ...prev,
                      address: {
                        ...prev.address,
                        line1: e.target.value
                      }
                    }))
                  }
                />
                <input
                  type="text"
                  className='border px-3 py-1 rounded text-sm'
                  value={profileData.address.line2}
                  onChange={(e) =>
                    setProfileData(prev => ({
                      ...prev,
                      address: {
                        ...prev.address,
                        line2: e.target.value
                      }
                    }))
                  }
                />
              </div>
            ) : (
              <p className='text-gray-600'>
                {profileData.address.line1}<br />
                {profileData.address.line2}
              </p>
            )
          }
        </div>

        {/* Trạng thái */}
        <div className='flex items-center gap-2 mb-4'>
          {
            isEdit ? (
              <>
                <input
                  type="checkbox"
                  id="available"
                  className='accent-blue-500'
                  checked={profileData.available}
                  onChange={(e) =>
                    setProfileData(prev => ({
                      ...prev,
                      available: e.target.checked
                    }))
                  }
                />
                <label htmlFor="available" className='text-sm text-gray-700'>Available</label>
              </>
            ) : (
              <>
                <input
                  type="checkbox"
                  id="available"
                  className='accent-blue-500'
                  checked={profileData.available}
                  readOnly
                />
                <label htmlFor="available" className='text-sm text-gray-700'>Available</label>
              </>
            )
          }
        </div>


        {/* Nút chỉnh sửa */}
        {
          isEdit
            ? <button
              onClick={updateProfile}
              className='px-4 py-2 border border-green-500 text-green-600 rounded hover:bg-green-50 transition cursor-pointer'>
              Save
            </button>
            : <button
              onClick={() => setIsEdit(true)}
              className='px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition cursor-pointer'>
              Edit
            </button>
        }

      </div>
    </div>
  );
};

export default DoctorProfile;
