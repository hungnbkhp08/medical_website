import React from 'react'
import { assets } from '../../assets/assets'
import { useState } from 'react'
import { AdminContext } from '../../context/AdminContext';
import { useContext } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
const AddDoctor = () => {
  const [docImg, setDocImg] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [experience, setExperience] = useState('1 Year');
  const [fees, setFees] = useState('');
  const [speciality, setSpeciality] = useState('General physician');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [about, setAbout] = useState('');
  const[degree, setDegree] = useState('');
  const {backendUrl,aToken}= useContext(AdminContext)
  //  Hàm kiểm tra tính hợp lệ của ảnh
    const validateImage = (file) => {
    // Kiểm tra có file không
    if (!file) {
      toast.error('Vui lòng chọn file');
      return false;
    }

    // Kiểm tra loại file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)');
      return false;
    }

    // Kiểm tra kích thước file 
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      return false;
    }

    return true;
  };

  //  Xử lý khi chọn file
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file && validateImage(file)) {
      setImage(file);
    } else {
      // Reset input nếu file không hợp lệ
      e.target.value = '';
      setImage(false);
    }
  };
  const onSubmitHandle = async (e) => {
    e.preventDefault();
    try{
      if(!docImg){
        return toast.error("Vui lòng tải lên ảnh bác sĩ");
      }
      const formData = new FormData();
      formData.append('image', docImg);
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('experience', experience);
      formData.append('fees', Number(fees));
      formData.append('speciality', speciality);
      formData.append('address', JSON.stringify({line1:address1, line2:address2}));
      formData.append('about', about);
      formData.append('degree', degree);
      formData.forEach((value, key) => {
        console.log(key, value);
      });
      const {data}= await axios.post(backendUrl+'/api/admin/add-doctor', formData, {headers: {aToken}})
      if(data.success){
        toast.success("Thêm bác sĩ thành công");
        setDocImg(false);
        setName('');
        setEmail('');
        setPassword('');
        setExperience('1 Year');
        setSpeciality('General physician');
        setFees('');
        setAddress1('');
        setAddress2('');
        setAbout('');
        setDegree('');
    }
      else{
        toast.error(data.message || "Không thể thêm bác sĩ");
      }
  }
    catch(err){
      console.error("Error adding doctor:", err);
      // You can also show a toast notification here
    }
  }
  return (
    <form onSubmit={onSubmitHandle} className='m-5 w-full'>
      <p className='mb-3 text-lg font-medium'>Thêm bác sĩ</p>
      <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll'>
        <div className='flex items-center gap-4 mb-8 text-gray-500'>
          <label htmlFor="doc-img">
            <img className='w-16 bg-gray-100 rounded-full cursor-pointer' src={docImg?URL.createObjectURL(docImg):assets.upload_area} alt="" />
          </label>
          <input onChange={handleImageChange} accept="image/*" type="file" id="doc-img" hidden />
          <p>Tải lên ảnh <br /> bác sĩ</p>
        </div>
        <div className='flex flex-col lg:flex-row gap-10 text-gray-600'>
          {/* Cột trái */}
          <div className='flex flex-col gap-4 w-full lg:flex-1'>
            <div className='flex flex-col gap-1'>
              <p>Tên bác sĩ</p>
              <input onChange={(e)=>setName(e.target.value)} value={name} className='border roundedm px-3 py-2' type="text" placeholder='Tên' required />
            </div>
            <div className='flex flex-col gap-1'>
              <p>Email bác sĩ</p>
              <input onChange={(e)=>setEmail(e.target.value)} value={email} className='border roundedm px-3 py-2' type="email" placeholder='Email' required />
            </div>
            <div className='flex flex-col gap-1'>
              <p>Mật khẩu bác sĩ</p>
              <input onChange={(e)=>setPassword(e.target.value)} value={password} className='border roundedm px-3 py-2' type="password" placeholder='Mật khẩu' required />
            </div>
            <div className='flex flex-col gap-1'>
              <p>Kinh nghiệm</p>
              <select onChange={(e)=>setExperience(e.target.value)} value={experience} className='border roundedm px-3 py-2' name="" id="">
                <option value="1">1 năm</option>
                <option value="2">2 năm</option>
                <option value="3">3 năm</option>
                <option value="4">4 năm</option>
                <option value="5">5 năm</option>
                <option value="6">6 năm</option>
                <option value="7">7 năm</option>
                <option value="8">8 năm</option>
                <option value="9">9 năm</option>
                <option value="10">10 năm</option>
              </select>
            </div>
            <div onChange={(e)=>setFees(e.target.value)} value={fees} className='flex flex-col gap-1'>
              <p>Phí khám</p>
              <input className='border roundedm px-3 py-2' type="number" placeholder='Phí khám' required />
            </div>
          </div>

          {/* Cột phải */}
          <div className='flex flex-col gap-4 w-full lg:flex-1'>
            <div className='flex flex-col gap-1'>
              <p>Chuyên khoa</p>
              <select onChange={(e)=>setSpeciality(e.target.value)} value={speciality} className='border roundedm px-3 py-2' name="" id="">
                <option value="General physician">Bác sĩ đa khoa</option>
                <option value="Gynecologist">Phụ khoa</option>
                <option value="Dermatologist">Da liễu</option>
                <option value="Pediatricians">Nhi khoa</option>
                <option value="Neurologist">Thần kinh</option>
                <option value="Gastroenterologist">Tiêu hóa</option>
              </select>
            </div>
            <div className='flex flex-col gap-1'>
              <p>Học vấn</p>
              <input onChange={(e)=>setDegree(e.target.value)} value={degree} className='border roundedm px-3 py-2' type="text" placeholder='Học vấn' required />
            </div>
            <div className='flex flex-col gap-1'>
              <p>Địa chỉ</p>
              <input onChange={(e)=>setAddress1(e.target.value)} value={address1} className='border roundedm px-3 py-2' type="text" placeholder='Địa chỉ 1' required />
              <input onChange={(e)=>setAddress2(e.target.value)} value={address2} className='border roundedm px-3 py-2' type="text" placeholder='Địa chỉ 2' required />
            </div>
          </div>
        </div>

        {/* Thông tin thêm */}
        <div className='mt-6'>
          <p className='mt-4 mb-2'>Giới thiệu bác sĩ</p>
          <textarea onChange={(e)=>setAbout(e.target.value)} value={about} className='w-full px-4 pt-2 border rounded' type="text" placeholder='Giới thiệu về bác sĩ' rows={5} required />
        </div>
        <button  type='submit' className='bg-[#5f6FFF] px-10 py-3 mt-4 text-white rounded-full cursor-pointer' >Thêm bác sĩ</button>
      </div>
    </form>
  )
}

export default AddDoctor
