import React, { useEffect, useState, useContext } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import { toast } from 'react-toastify'
import axios from 'axios'
import StarIcon from '@mui/icons-material/Star';
const Appointment = () => {
  const { docId } = useParams()
  const { doctors, currencySymbol, backendUrl, token, getDoctorData } = useContext(AppContext)
  const [docInfo, setDocInfo] = useState(null)
  const [docSlots, setDocSlots] = useState([])
  const [slotIndex, setSlotIndex] = useState(0)
  const [slotTime, setSlotTime] = useState('')
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const navigate = useNavigate()
  const fetchDocInfo = async () => {
    const docInfo = doctors.find(doc => doc._id === docId)
    setDocInfo(docInfo)
    console.log(docInfo)
  }
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const submitReview = async () => {
    if (!token) {
      toast.warn("Vui lòng đăng nhập để đánh giá");
      return navigate("/login");
    }
    if (rating === 0) {
      toast.warn("Vui lòng chọn số sao");
      return;
    }
    try {
      const { data } = await axios.post(
        backendUrl + "/api/review/review-doctor",
        { docId, rating, comment: reviewText },
        { headers: { token } }
      );
      if (data.success) {
        toast.success("Đánh giá thành công!");
        setRating(0);
        setReviewText("");
        fetchReviews();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
  const getAvailableSlots = async () => {
    setDocSlots([])
    //getting current date
    let today = new Date()
    for (let i = 0; i < 7; i++) {
      //getting date with index
      let currentDate = new Date(today)
      currentDate.setDate(today.getDate() + i)
      //setting end time of date with index
      let endTime = new Date()
      endTime.setDate(today.getDate() + i)
      endTime.setHours(21, 0, 0, 0)
      //setting hours
      if (today.getDate() === currentDate.getDate()) {
        currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10)
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0)
      }
      else {
        currentDate.setHours(10)
        currentDate.setMinutes(0)
      }
      let timeSlots = []
      while (currentDate < endTime) {
        let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        let day = currentDate.getDate()
        let month = currentDate.getMonth() + 1
        let year = currentDate.getFullYear()
        const slotDate = day + "_" + month + '_' + year
        const slotTime = formattedTime

        const isSlotAvaiilable = docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(slotTime) ? false : true

        if (isSlotAvaiilable) {
          //add slot to array
          timeSlots.push({
            dateTime: new Date(currentDate),
            time: formattedTime
          })
        }
        // increment current time by 30 min
        currentDate.setMinutes(currentDate.getMinutes() + 30)
      }
      setDocSlots(prev => ([...prev, timeSlots]))
    }
  }
  const bookAppointment = async () => {
    if (!token) {
      toast.warn('Login to book appointment')
      return navigate('/login')
    }
    try {
      const date = docSlots[slotIndex][0].dateTime
      let day = date.getDate()
      let month = date.getMonth() + 1
      let year = date.getFullYear()
      const slotDate = day + "_" + month + '_' + year
      const { data } = await axios.post(backendUrl + '/api/user/book-appointment', { docId, slotDate, slotTime }, { headers: { token } })
      if (data.success) {
        toast.success(data.message)
        getDoctorData()
        navigate('/my-appointments')
      }
      else {
        toast.error(data.message)
      }
    }
    catch (error) {
      toast.error(error.message);
    }
  }
  const fetchReviews = async () => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/review/get-list", { docId }
      );
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (docId) fetchReviews();
  }, [docId]);
  useEffect(() => {
    fetchDocInfo()
  }, [doctors, docId])
  useEffect(() => {
    getAvailableSlots()
  }, [docInfo])
  useEffect(() => {
    console.log(docSlots)
  }, [docSlots])
  return docInfo && (
    <div>
      {/* Doctor detail */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div>
          <img className='bg-[#5f6FFF] w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
        </div>
        <div className='flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
          {/* Doctor info */}
          <p className='flex items-center gap-2 text-2xl font-medium text-gray-900'>{docInfo.name}
            <img className='w-5' src={assets.verified_icon} alt="" />
          </p>
          <div className='flex items-center gap-2 text-sm mt-1 text-gray-600'>
            <p>{docInfo.degree}-{docInfo.speciality}</p>
            <button className='py-0.5 px-2 border text-xs rounded-full cursor-pointer'>{docInfo.experience}</button>
          </div>
          <div>
            {/* Doctor About */}
            <p className='flex item-center gap-1 text-sm font-medium text-gray-900 mt-3'>About
              <img src={assets.info_icon} alt="" />
            </p>
            <p className='text-sm text-gray-600 max-w-[700px] mt-1'>{docInfo.about}</p>
          </div>
          <p className='text-gray-500 font-medium mt-4'>
            Đơn giá:<span className='text-gray-600'>{currencySymbol}{docInfo.fees}</span>
          </p>
        </div>
      </div>
      {/* Booking Slot */}
      <div className='sm:ml-72 sm:pl-4 mt-4 text-gray-700 '>
        <p>Lịch đặt chỗ</p>
        <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
          {
            docSlots.length && docSlots.map((item, index) => (
              <div onClick={() => setSlotIndex(index)} className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? 'bg-[#5f6FFF] text-white' : 'border border-gray-200'}`} key={index}>
                <p>{item[0] && daysOfWeek[item[0].dateTime.getDay()]}</p>
                <p>{item[0] && item[0].dateTime.getDate()}</p>
              </div>
            ))
          }
        </div>
        <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4 '>
          {docSlots.length && docSlots[slotIndex].map((item, index) => (
            <p onClick={() => setSlotTime(item.time)} className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-[#5f6FFF] text-white' : 'text-gray-400 border border-gray-300'}`} key={index}>
              {item.time.toLowerCase()}
            </p>
          ))}
        </div>
        <button onClick={bookAppointment} className='bg-[#5f6FFF] text-white text-sm font-light px-14 py-3 rounded-full my-6 cursor-pointer'> Đặt lịch</button>
      </div>
      {/* Review Section */}
      <div className="sm:ml-72 sm:pl-4 mt-6 bg-white p-6 rounded-lg border border-gray-300">
        <h2 className="text-lg font-medium text-gray-900 mb-3">Đánh giá bác sĩ</h2>

        {/*  Danh sách review */}
        <div className="space-y-4 mb-6">
          {reviews.length > 0 ? (
            reviews.map((rev, idx) => (
              <div key={idx} className="border-b pb-3">
                <div className="flex items-center gap-2">
                  {/* Avatar user */}
                  <img
                    src={rev.user.image || "/default-avatar.png"}
                    alt=''
                    className="w-10 h-10 rounded-full object-cover"
                  />
                     <span className="text-sm text-gray-700 font-medium">
                        {rev.user.name}
                      </span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      {/* Hiển thị số sao */}
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`w-5 h-5 ${star <= rev.rating ? "text-yellow-400" : "text-gray-300"
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Nội dung comment */}
                <p className="text-sm text-gray-700 mt-2">{rev.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">Chưa có đánh giá nào</p>
          )}
        </div>

        {/* Form gửi đánh giá */}
        <div>
          {/* Chọn số sao */}
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                onClick={() => setRating(star)}
                className={`w-7 h-7 cursor-pointer ${star <= rating ? "text-yellow-400" : "text-gray-300"
                  }`}
              />
            ))}
          </div>
          {/* Nhập nhận xét */}
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Nhập đánh giá của bạn..."
            className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-3"
            rows={3}
          />

          {/* Nút gửi */}
          <button
            onClick={submitReview}
            className="bg-[#5f6FFF] text-white px-6 py-2 rounded-full text-sm"
          >
            Gửi đánh giá
          </button>
        </div>
      </div>

      {/* Related Doctors */}
      <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
    </div>
  )
}

export default Appointment