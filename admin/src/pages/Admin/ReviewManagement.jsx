import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const ReviewManagement = () => {
  const { aToken, backendUrl } = useContext(AdminContext);
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  // Lấy tất cả đánh giá
  const getAllReviews = async () => {
    try {
      const { data } = await axios.post(backendUrl + '/api/review/get-all', {}, { headers: { aToken } });
      if (data.success) {
        setReviews(data.reviews);
        setFilteredReviews(data.reviews);
        calculateStats(data.reviews);
        
        // Lấy danh sách bác sĩ unique
        const uniqueDoctors = [...new Map(data.reviews.map(review => 
          [review.doctor._id, review.doctor])).values()];
        setDoctors(uniqueDoctors);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Tính toán thống kê
  const calculateStats = (reviewList) => {
    const totalReviews = reviewList.length;
    const averageRating = totalReviews > 0 
      ? (reviewList.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1)
      : 0;
    
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviewList.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    setStats({ totalReviews, averageRating, ratingDistribution });
  };

  // Lọc đánh giá
  const filterReviews = () => {
    let filtered = [...reviews];

    if (selectedDoctor !== 'all') {
      filtered = filtered.filter(review => review.doctor._id === selectedDoctor);
    }

    if (selectedRating !== 'all') {
      filtered = filtered.filter(review => review.rating === parseInt(selectedRating));
    }

    setFilteredReviews(filtered);
    calculateStats(filtered);
  };

  useEffect(() => {
    if (aToken) {
      getAllReviews();
    }
  }, [aToken]);

  useEffect(() => {
    filterReviews();
  }, [selectedDoctor, selectedRating, reviews]);

  // Render sao
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`text-lg ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  // Format ngày
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý đánh giá</h1>
        <button
          onClick={getAllReviews}
          className="px-4 py-2 bg-[#5F6FFF] text-white rounded-lg hover:bg-[#4F5FEF] transition"
        >
          Làm mới
        </button>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-[#5F6FFF] mb-2">{stats.totalReviews}</div>
          <div className="text-gray-600">Tổng đánh giá</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-bold text-[#5F6FFF]">{stats.averageRating}</span>
            <div className="flex">{renderStars(Math.round(stats.averageRating))}</div>
          </div>
          <div className="text-gray-600">Đánh giá trung bình</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border col-span-1 md:col-span-2">
          <div className="text-sm font-medium text-gray-700 mb-3">Phân bố đánh giá</div>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm w-6">{star}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all"
                    style={{
                      width: stats.totalReviews > 0 
                        ? `${(stats.ratingDistribution[star] / stats.totalReviews) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8">
                  {stats.ratingDistribution[star]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Bác sĩ:</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F6FFF]"
            >
              <option value="all">Tất cả bác sĩ</option>
              {doctors.map(doctor => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.name} - {doctor.speciality}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Số sao:</label>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F6FFF]"
            >
              <option value="all">Tất cả</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Hiển thị {filteredReviews.length} / {reviews.length} đánh giá
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Danh sách đánh giá - 2/3 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Danh sách đánh giá</h2>
            </div>

            {filteredReviews.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Không có đánh giá nào phù hợp với bộ lọc
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredReviews.map((review) => (
                  <div key={review._id} className="p-6">
                    <div className="flex gap-4">
                      {/* Avatar bệnh nhân */}
                      <div className="flex-shrink-0">
                        <img
                          src={review.user.image || '/api/placeholder/40/40'}
                          alt={review.user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      </div>

                      <div className="flex-1 space-y-3">
                        {/* Thông tin bệnh nhân và bác sĩ */}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="font-medium text-gray-900">{review.user.name}</div>
                          <div className="text-gray-500">đánh giá</div>
                          <div className="flex items-center gap-2">
                            <img
                              src={review.doctor.image || '/api/placeholder/24/24'}
                              alt={review.doctor.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="font-medium text-[#5F6FFF]">
                              {review.doctor.name}
                            </span>
                            <span className="text-gray-500">({review.doctor.speciality})</span>
                          </div>
                          <div className="text-gray-400">•</div>
                          <div className="text-gray-500">{formatDate(review.date)}</div>
                        </div>

                        {/* Đánh giá sao */}
                        <div className="flex items-center gap-2">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <span className="text-sm font-medium text-gray-700">
                            {review.rating}/5
                          </span>
                        </div>

                        {/* Nội dung đánh giá */}
                        <div className="text-gray-700 leading-relaxed">
                          {review.comment}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar bên phải - 1/3 */}
        <div className="lg:col-span-1 space-y-6">
          {/* Top Doctors by Reviews */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Bác sĩ được đánh giá cao</h3>
            </div>
            <div className="p-4">
              {doctors
                .map(doctor => {
                  const doctorReviews = reviews.filter(r => r.doctor._id === doctor._id);
                  const avgRating = doctorReviews.length > 0 
                    ? (doctorReviews.reduce((sum, r) => sum + r.rating, 0) / doctorReviews.length).toFixed(1)
                    : 0;
                  return { ...doctor, avgRating: parseFloat(avgRating), reviewCount: doctorReviews.length };
                })
                .filter(doctor => doctor.reviewCount > 0)
                .sort((a, b) => b.avgRating - a.avgRating)
                .slice(0, 5)
                .map((doctor, index) => (
                  <div key={doctor._id} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-[#5F6FFF] to-[#4F5FEF] rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>
                    <img
                      src={doctor.image || '/api/placeholder/32/32'}
                      alt={doctor.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {doctor.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {doctor.speciality}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm font-medium">{doctor.avgRating}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {doctor.reviewCount} đánh giá
                      </div>
                    </div>
                  </div>
                ))}
              {doctors.filter(doctor => reviews.filter(r => r.doctor._id === doctor._id).length > 0).length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  Chưa có đánh giá nào
                </div>
              )}
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Đánh giá gần đây</h3>
            </div>
            <div className="p-4 space-y-4">
              {reviews
                .slice()
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 3)
                .map((review) => (
                  <div key={review._id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <img
                        src={review.user.image || '/api/placeholder/32/32'}
                        alt={review.user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {review.user.name}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {review.comment}
                        </p>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(review.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              {reviews.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  Chưa có đánh giá nào
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          {/* <div className="bg-gradient-to-r from-[#5F6FFF] to-[#4F5FEF] rounded-lg p-4 text-white">
            <h3 className="font-semibold mb-3">Thống kê nhanh</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">Đánh giá tốt (4-5⭐)</span>
                <span className="font-medium">
                  {stats.ratingDistribution[4] + stats.ratingDistribution[5]}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">Đánh giá trung bình (3⭐)</span>
                <span className="font-medium">{stats.ratingDistribution[3]}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">Đánh giá kém (1-2⭐)</span>
                <span className="font-medium">
                  {stats.ratingDistribution[1] + stats.ratingDistribution[2]}
                </span>
              </div>
              <hr className="border-white/20 my-2" />
              <div className="flex justify-between items-center font-semibold">
                <span className="text-sm">Tỷ lệ hài lòng</span>
                <span>
                  {stats.totalReviews > 0 
                    ? Math.round(((stats.ratingDistribution[4] + stats.ratingDistribution[5]) / stats.totalReviews) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ReviewManagement;