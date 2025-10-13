import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const DoctorReviewManagement = () => {
  const { dToken, backendUrl } = useContext(DoctorContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState('all');
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  // Lấy đánh giá của bác sĩ
  const getDoctorReviews = async () => {
    try {
      const { data } = await axios.post(backendUrl + '/api/review/get-list-doctor', {}, { headers: { dToken } });
      if (data.success) {
        setReviews(data.reviews);
        setFilteredReviews(data.reviews);
        calculateStats(data.reviews);
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

  // Lọc đánh giá theo rating
  const filterReviews = () => {
    let filtered = [...reviews];

    if (selectedRating !== 'all') {
      filtered = filtered.filter(review => review.rating === parseInt(selectedRating));
    }

    setFilteredReviews(filtered);
    calculateStats(filtered);
  };

  useEffect(() => {
    if (dToken ) {
      getDoctorReviews();
    }
  }, [dToken]);

  useEffect(() => {
    filterReviews();
  }, [selectedRating, reviews]);

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
        <h1 className="text-2xl font-bold text-gray-800">Đánh giá của bệnh nhân</h1>
        <button
          onClick={getDoctorReviews}
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
          <div className="text-gray-600">Điểm trung bình</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {stats.ratingDistribution[4] + stats.ratingDistribution[5]}
          </div>
          <div className="text-gray-600">Đánh giá tích cực</div>
          <div className="text-sm text-gray-500">
            ({stats.totalReviews > 0 
              ? Math.round(((stats.ratingDistribution[4] + stats.ratingDistribution[5]) / stats.totalReviews) * 100)
              : 0}%)
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-red-600 mb-2">
            {stats.ratingDistribution[1] + stats.ratingDistribution[2]}
          </div>
          <div className="text-gray-600">Cần cải thiện</div>
          <div className="text-sm text-gray-500">
            ({stats.totalReviews > 0 
              ? Math.round(((stats.ratingDistribution[1] + stats.ratingDistribution[2]) / stats.totalReviews) * 100)
              : 0}%)
          </div>
        </div>
      </div>

      {/* Phân bố đánh giá chi tiết */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Phân bố đánh giá</h2>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} className="flex items-center gap-4">
              <span className="text-sm font-medium w-12">{star} sao</span>
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    star >= 4 ? 'bg-green-500' : star === 3 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{
                    width: stats.totalReviews > 0 
                      ? `${(stats.ratingDistribution[star] / stats.totalReviews) * 100}%`
                      : '0%'
                  }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">
                {stats.ratingDistribution[star]}
              </span>
              <span className="text-sm text-gray-500 w-12 text-right">
                {stats.totalReviews > 0 
                  ? `${Math.round((stats.ratingDistribution[star] / stats.totalReviews) * 100)}%`
                  : '0%'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Lọc theo số sao:</label>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#5F6FFF]"
            >
              <option value="all">Tất cả đánh giá</option>
              <option value="5">5 sao - Xuất sắc</option>
              <option value="4">4 sao - Tốt</option>
              <option value="3">3 sao - Trung bình</option>
              <option value="2">2 sao - Kém</option>
              <option value="1">1 sao - Rất kém</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Hiển thị {filteredReviews.length} / {reviews.length} đánh giá
          </div>
        </div>
      </div>

      {/* Danh sách đánh giá */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Chi tiết đánh giá</h2>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-3">
              <svg className="mx-auto w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <div className="text-gray-500 mb-1">
              {reviews.length === 0 ? 'Chưa có đánh giá nào' : 'Không có đánh giá nào phù hợp với bộ lọc'}
            </div>
            {reviews.length === 0 && (
              <div className="text-sm text-gray-400">
                Hãy cung cấp dịch vụ tốt để nhận được đánh giá từ bệnh nhân
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReviews.map((review) => (
              <div key={review._id} className="p-6">
                <div className="flex gap-4">
                  {/* Avatar bệnh nhân */}
                  <div className="flex-shrink-0">
                    <img
                      src={review.user.image || '/api/placeholder/48/48'}
                      alt={review.user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-3">
                    {/* Thông tin bệnh nhân */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="font-medium text-gray-900">{review.user.name}</div>
                        <div className="text-gray-400">•</div>
                        <div className="text-sm text-gray-500">{formatDate(review.date)}</div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        review.rating >= 4 
                          ? 'bg-green-100 text-green-800' 
                          : review.rating === 3 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {review.rating >= 4 ? 'Tích cực' : review.rating === 3 ? 'Trung bình' : 'Tiêu cực'}
                      </div>
                    </div>

                    {/* Đánh giá sao */}
                    <div className="flex items-center gap-3">
                      <div className="flex">{renderStars(review.rating)}</div>
                      <span className="text-sm font-medium text-gray-700">
                        {review.rating}/5 sao
                      </span>
                    </div>

                    {/* Nội dung đánh giá */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 leading-relaxed italic">
                        "{review.comment}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lời khuyên cải thiện */}
      {stats.totalReviews > 0 && stats.averageRating < 4 && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2A7,7 0 0,1 19,9C19,11.38 17.81,13.47 16,14.74V17A1,1 0 0,1 15,18H9A1,1 0 0,1 8,17V14.74C6.19,13.47 5,11.38 5,9A7,7 0 0,1 12,2M9,21V20H15V21A1,1 0 0,1 14,22H10A1,1 0 0,1 9,21M12,4A5,5 0 0,0 7,9C7,11.05 8.23,12.81 10,13.58V16H14V13.58C15.77,12.81 17,11.05 17,9A5,5 0 0,0 12,4Z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-yellow-800 mb-2">Gợi ý cải thiện</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Lắng nghe phản hồi của bệnh nhân và cải thiện dịch vụ</li>
                <li>• Tăng cường giao tiếp với bệnh nhân trong quá trình khám</li>
                <li>• Đảm bảo thời gian khám đúng hẹn</li>
                <li>• Giải thích rõ ràng về tình trạng sức khỏe và phương pháp điều trị</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Lời cảm ơn cho đánh giá tốt */}
      {stats.totalReviews > 0 && stats.averageRating >= 4.5 && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-green-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23,12L20.56,9.22L20.9,5.54L17.29,4.72L15.4,1.54L12,3L8.6,1.54L6.71,4.72L3.1,5.53L3.44,9.21L1,12L3.44,14.78L3.1,18.47L6.71,19.29L8.6,22.47L12,21L15.4,22.46L17.29,19.28L20.9,18.46L20.56,14.78L23,12M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-green-800 mb-2">Xuất sắc!</h3>
              <p className="text-sm text-green-700">
                Bạn đang cung cấp dịch vụ khám bệnh rất tốt. Hãy tiếp tục duy trì chất lượng này!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorReviewManagement;