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
  const onSubmitHandle = async (e) => {
    e.preventDefault();
    try{
      if(!docImg){
        return toast.error("Please upload a doctor image");
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
        toast.success("Doctor added successfully");
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
        toast.error(data.message || "Failed to add doctor");
      }
  }
    catch(err){
      console.error("Error adding doctor:", err);
      // You can also show a toast notification here
    }
  }
  return (
    <form onSubmit={onSubmitHandle} className='m-5 w-full'>
      <p className='mb-3 text-lg font-medium'>Add Doctor</p>
      <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll'>
        <div className='flex items-center gap-4 mb-8 text-gray-500'>
          <label htmlFor="doc-img">
            <img className='w-16 bg-gray-100 rounded-full cursor-pointer' src={docImg?URL.createObjectURL(docImg):assets.upload_area} alt="" />
          </label>
          <input onChange={(e)=>setDocImg(e.target.files[0])} type="file" id="doc-img" hidden />
          <p>Upload doctor <br /> picture</p>
        </div>
        <div className='flex flex-col lg:flex-row gap-10 text-gray-600'>
          {/* Cột trái */}
          <div className='flex flex-col gap-4 w-full lg:flex-1'>
            <div className='flex flex-col gap-1'>
              <p>Doctor name</p>
              <input onChange={(e)=>setName(e.target.value)} value={name} className='border roundedm px-3 py-2' type="text" placeholder='Name' required />
            </div>
            <div className='flex flex-col gap-1'>
              <p>Doctor email</p>
              <input onChange={(e)=>setEmail(e.target.value)} value={email} className='border roundedm px-3 py-2' type="email" placeholder='Email' required />
            </div>
            <div className='flex flex-col gap-1'>
              <p>Doctor password</p>
              <input onChange={(e)=>setPassword(e.target.value)} value={password} className='border roundedm px-3 py-2' type="password" placeholder='Password' required />
            </div>
            <div className='flex flex-col gap-1'>
              <p>Experience</p>
              <select onChange={(e)=>setExperience(e.target.value)} value={experience} className='border roundedm px-3 py-2' name="" id="">
                <option value="1">1 year</option>
                <option value="2">2 years</option>
                <option value="3">3 years</option>
                <option value="4">4 years</option>
                <option value="5">5 years</option>
                <option value="6">6 years</option>
                <option value="7">7 years</option>
                <option value="8">8 years</option>
                <option value="9">9 years</option>
                <option value="10">10 years</option>
              </select>
            </div>
            <div onChange={(e)=>setFees(e.target.value)} value={fees} className='flex flex-col gap-1'>
              <p>Fees</p>
              <input className='border roundedm px-3 py-2' type="number" placeholder='Fees' required />
            </div>
          </div>

          {/* Cột phải */}
          <div className='flex flex-col gap-4 w-full lg:flex-1'>
            <div className='flex flex-col gap-1'>
              <p>Specialization</p>
              <select onChange={(e)=>setSpeciality(e.target.value)} value={speciality} className='border roundedm px-3 py-2' name="" id="">
                <option value="General physician">General physician</option>
                <option value="Gynecologist">Gynecologist</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Pediatricians">Pediatricians</option>
                <option value="Neurologist">Neurologist</option>
                <option value="Gastroenterologist">Gastroenterologist</option>
              </select>
            </div>
            <div className='flex flex-col gap-1'>
              <p>Education</p>
              <input onChange={(e)=>setDegree(e.target.value)} value={degree} className='border roundedm px-3 py-2' type="text" placeholder='Education' required />
            </div>
            <div className='flex flex-col gap-1'>
              <p> Address</p>
              <input onChange={(e)=>setAddress1(e.target.value)} value={address1} className='border roundedm px-3 py-2' type="text" placeholder='Address 1' required />
              <input onChange={(e)=>setAddress2(e.target.value)} value={address2} className='border roundedm px-3 py-2' type="text" placeholder='Address 2' required />
            </div>
          </div>
        </div>

        {/* Thông tin thêm */}
        <div className='mt-6'>
          <p className='mt-4 mb-2'>About Doctor</p>
          <textarea onChange={(e)=>setAbout(e.target.value)} value={about} className='w-full px-4 pt-2 border rounded' type="text" placeholder='About Doctor' rows={5} required />
        </div>
        <button  type='submit' className='bg-[#5f6FFF] px-10 py-3 mt-4 text-white rounded-full cursor-pointer' >Add Doctor</button>
      </div>
    </form>
  )
}

export default AddDoctor
