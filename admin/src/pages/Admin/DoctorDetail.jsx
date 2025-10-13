import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';
import axios from 'axios';

const DoctorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { doctors, aToken, getAllDoctors, changeAvailability, backendUrl } = useContext(AdminContext);
  const { currency } = useContext(AppContext);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEdit, setIsEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (aToken) {
      getAllDoctors();
    }
  }, [aToken]);

  useEffect(() => {
    if (doctors.length > 0) {
      const foundDoctor = doctors.find(doc => doc._id === id);
      setDoctor(foundDoctor);
      setLoading(false);
    }
  }, [doctors, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-500">Đang tải thông tin bác sĩ...</div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
        <div className="text-lg text-red-500">Không tìm thấy thông tin bác sĩ</div>
        <button
          onClick={() => navigate('/doctor-list')}
          className="px-4 py-2 bg-[#5F6FFF] text-white rounded-lg hover:bg-[#4F5FEF] transition"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const handleAvailabilityChange = () => {
    changeAvailability(doctor._id);
    setDoctor(prev => ({ ...prev, available: !prev.available }));
  };

  const updateDoctorProfile = async () => {
    try {
      const updateData = {
        docId: doctor._id,
        address: doctor.address,
        fees: doctor.fees,
        available: doctor.available,
      }
      const { data } = await axios.post(backendUrl + '/api/admin/update-doctor', updateData, { headers: { aToken } });
      if (data.success) {
        toast.success(data.message);
        setIsEdit(false);
        getAllDoctors();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message)
    }
  };

  const handleDeleteDoctor = async () => {
    try {
      const { data } = await axios.post(backendUrl + '/api/admin/delete-doctor', { docId: doctor._id }, { headers: { aToken } });
      if (data.success) {
        toast.success('Xóa bác sĩ thành công');
        setShowDeleteModal(false);
        navigate('/doctor-list');
      } else {
        toast.error(data.message);
        setShowDeleteModal(false);
      }
    } catch (error) {
      toast.error(error.message);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="p-5 relative">
      {/* Header với nút quay lại */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/doctor-list')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm"
        >
          <span>←</span> Quay lại
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Thông tin chi tiết bác sĩ</h1>
      </div>

      {/* Ảnh đại diện */}
      <div className='flex justify-center mb-6'>
        <img
          className='bg-[#5f6FFF]/80 w-full sm:max-w-64 rounded-lg shadow-md'
          src={doctor.image}
          alt={doctor.name}
        />
      </div>

      {/* Thông tin chính */}
      <div className='border border-stone-200 rounded-lg p-6 bg-white shadow-sm'>
        <h2 className='text-xl font-semibold mb-2'>{doctor.name}</h2>
        <div className="flex items-center gap-3 mb-2">
          <p className='text-gray-700'>
            {doctor.degree} - {doctor.speciality}
          </p>
          <p className='py-0.5 px-2 border text-xs rounded-full text-gray-600'>
            {doctor.experience}
          </p>
        </div>

        {/* Giới thiệu */}
        <div className='mb-4'>
          <p className='font-medium'>Giới thiệu:</p>
          <p className='text-gray-600'>{doctor.about}</p>
        </div>

        {/* Email */}
        <div className='mb-4'>
          <p className='font-medium'>Email:</p>
          <p className='text-gray-600'>{doctor.email}</p>
        </div>

        {/* Phí khám */}
        <div className='mb-4'>
          <p className='font-medium'>
            Phí khám bệnh:
            {
              isEdit ? (
                <span className='ml-2 text-blue-600'>
                  {currency}
                  <input
                    type="number"
                    className='ml-1 border px-2 py-1 rounded w-24'
                    onChange={(e) => setDoctor(prev => ({ ...prev, fees: e.target.value }))}
                    value={doctor.fees}
                  />
                </span>
              ) : (
                <span className='ml-2 text-blue-600'>
                  {currency} {doctor.fees?.toLocaleString()}
                </span>
              )
            }
          </p>
        </div>

        {/* Địa chỉ */}
        <div className='mb-4'>
          <p className='font-medium mb-1'>Địa chỉ:</p>
          {
            isEdit ? (
              <div className='flex flex-col gap-2'>
                <input
                  type="text"
                  className='border px-3 py-1 rounded text-sm'
                  value={doctor.address?.line1 || ''}
                  onChange={(e) =>
                    setDoctor(prev => ({
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
                  value={doctor.address?.line2 || ''}
                  onChange={(e) =>
                    setDoctor(prev => ({
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
                {doctor.address?.line1}<br />
                {doctor.address?.line2}
              </p>
            )
          }
        </div>

        {/* Ngày tham gia */}
        <div className='mb-4'>
          <p className='font-medium mb-1'>Ngày tham gia:</p>
          <p className='text-gray-600'>
            {new Date(doctor.date).toLocaleDateString('vi-VN')}
          </p>
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
                  checked={doctor.available}
                  onChange={(e) =>
                    setDoctor(prev => ({
                      ...prev,
                      available: e.target.checked
                    }))
                  }
                />
                <label htmlFor="available" className='text-sm text-gray-700'>Đang hoạt động</label>
              </>
            ) : (
              <>
                <input
                  type="checkbox"
                  id="available"
                  className='accent-blue-500'
                  checked={doctor.available}
                  readOnly
                />
                <label htmlFor="available" className='text-sm text-gray-700'>Đang hoạt động</label>
              </>
            )
          }
        </div>

        {/* Nút hành động */}
        <div className='flex gap-3'>
          {
            isEdit
              ? <button
                onClick={updateDoctorProfile}
                className='px-4 py-2 border border-green-500 text-green-600 rounded hover:bg-green-50 transition cursor-pointer'>
                Lưu
              </button>
              : <button
                onClick={() => setIsEdit(true)}
                className='px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition cursor-pointer'>
                Chỉnh sửa
              </button>
          }
          
          {!isEdit && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className='px-4 py-2 border border-red-500 text-red-600 rounded hover:bg-red-50 transition cursor-pointer'>
              Xóa
            </button>
          )}
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
       <div 
          className="fixed top-0 right-0 bottom-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50" 
          style={{left: 'var(--sidebar-width, 240px)'}}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              {/* Icon cảnh báo */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>

              {/* Tiêu đề */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Xác nhận xóa bác sĩ
              </h3>

              {/* Thông báo */}
              <p className="text-gray-500 mb-6">
                Bạn có chắc chắn muốn xóa bác sĩ <strong>{doctor.name}</strong>?
                <br />
                <span className="text-red-500 font-medium">
                  Hành động này không thể hoàn tác!
                </span>
              </p>

              {/* Nút hành động */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteDoctor}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Xóa bác sĩ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDetail;