import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import ChatbotSec from '../../components/ChatbotSec';

const TABS = [
  { key: 'all',   label: 'Tất cả logs' },
  { key: 'hitl',  label: 'Prompt Injection Queue' },
];

const SEVERITY_STYLE = {
  CRITICAL: 'bg-red-100 text-red-600 border-red-200',
  HIGH:     'bg-orange-100 text-orange-600 border-orange-200',
  MEDIUM:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW:      'bg-green-100 text-green-700 border-green-200',
};

const STATUS_STYLE = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
};

const STATUS_LABEL = {
  pending:  'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Đã từ chối',
};

const Logs = () => {
  const { aToken, logs, getLogs, approveHitl, rejectHitl } = useContext(AdminContext);

  const [activeTab, setActiveTab]                   = useState('all');
  const [selectedLogForChat, setSelectedLogForChat] = useState(null);
  const [isChatOpen, setIsChatOpen]                 = useState(false);
  const [selectedLogForDetail, setSelectedLogForDetail] = useState(null);
  const [hitlFilter, setHitlFilter]                 = useState('pending');
  const [reviewModal, setReviewModal]               = useState(null); // { item, action: 'approve'|'reject' }
  const [reviewNote, setReviewNote]                 = useState('');
  const [loadingId, setLoadingId]                   = useState(null);

  useEffect(() => {
    if (aToken) getLogs();
  }, [aToken]);

  const handleOpenChat = (item) => {
    setSelectedLogForChat(item);
    setIsChatOpen(true);
  };

  // ── Tách logs theo tab ───────────────────────────────────────────
  const allLogs  = (logs || []).filter(l => l.rule_id !== 'LAYER4_HITL');
  const hitlLogs = (logs || []).filter(l => l.rule_id === 'LAYER4_HITL');
  const filteredHitl = hitlFilter === 'all'
    ? hitlLogs
    : hitlLogs.filter(l => l.status === hitlFilter);

  // ── Approve / Reject ─────────────────────────────────────────────
  const handleReviewSubmit = async () => {
    if (!reviewModal) return;
    setLoadingId(reviewModal.item.unique_id);
    try {
      if (reviewModal.action === 'approve') {
        await approveHitl(reviewModal.item.unique_id, reviewNote);
      } else {
        await rejectHitl(reviewModal.item.unique_id, reviewNote);
      }
      await getLogs();
    } finally {
      setLoadingId(null);
      setReviewModal(null);
      setReviewNote('');
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className='w-full m-5 pr-5'>
      <p className='mb-4 text-lg font-medium'>Hệ thống Logs bảo mật</p>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className='flex gap-1 mb-4 border-b'>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors border-b-2 -mb-px
              ${activeTab === tab.key
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            {tab.label}
            {tab.key === 'hitl' && hitlLogs.filter(l => l.status === 'pending').length > 0 && (
              <span className='ml-2 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5'>
                {hitlLogs.filter(l => l.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 1 — Tất cả logs                                       */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'all' && (
        <div className='bg-white border rounded text-sm max-h-[80vh] min-h-[50vh] overflow-y-scroll'>
          <div className='max-sm:hidden grid grid-cols-[1.5fr_1fr_2fr_3fr_1fr_1fr_1fr] bg-[#f8f9fd] py-3 px-6 border-b items-center gap-4'>
            <p className='font-semibold'>Thời gian</p>
            <p className='font-semibold'>Mã Rule</p>
            <p className='font-semibold'>Mô tả</p>
            <p className='font-semibold'>Dữ liệu chi tiết</p>
            <p className='font-semibold'>Mức độ</p>
            <p className='font-semibold'>Nguồn</p>
            <p className='font-semibold'>Hành động</p>
          </div>

          {allLogs.length > 0 ? allLogs.map((item, index) => (
            <div
              key={item._id || index}
              className={`flex flex-col gap-2 max-sm:p-4 text-gray-600 py-3 px-6 border-b sm:grid sm:grid-cols-[1.5fr_1fr_2fr_3fr_1fr_1fr_1fr] items-center gap-4 hover:bg-gray-50
                ${item.severity_label === 'CRITICAL' ? 'bg-red-50' : ''}`}
            >
              <div className='sm:hidden flex justify-between w-full'>
                <p className='text-gray-800 font-medium'>{new Date(item.created_at).toLocaleString()}</p>
                <span className={`px-2 py-1 text-xs rounded-full font-medium border ${SEVERITY_STYLE[item.severity_label] || 'bg-gray-100 text-gray-600'}`}>
                  {item.severity_label}
                </span>
              </div>

              <p className='max-sm:hidden text-gray-500'>{new Date(item.created_at).toLocaleString('vi-VN')}</p>
              <p>{item.rule_id}</p>
              <p className='truncate' title={item.msg}>{item.msg}</p>
              <div className='truncate max-w-full text-xs bg-gray-100 p-1 rounded font-mono' title={item.data}>{item.data}</div>
              <span className={`hidden sm:inline-block px-2 py-1 text-xs rounded-full text-center font-medium border ${SEVERITY_STYLE[item.severity_label] || 'bg-gray-100 text-gray-600'}`}>
                {item.severity_label}
              </span>
              <p>{item.source}</p>
              <div className='flex flex-row gap-2'>
                <button onClick={() => setSelectedLogForDetail(item)}
                  className='bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-md border'
                  title='Xem chi tiết'>
                  <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                  </svg>
                </button>
                <button onClick={() => handleOpenChat(item)}
                  className='bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md'
                  title='Tư vấn hành động bảo mật'>
                  <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </button>
              </div>
            </div>
          )) : (
            <div className='p-8 text-center text-gray-500'>Hệ thống chưa ghi nhận log nào.</div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TAB 2 — Prompt Injection Queue (LAYER4_HITL)              */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeTab === 'hitl' && (
        <div className='bg-white border rounded text-sm min-h-[50vh]'>

          {/* Sub-filter */}
          <div className='flex gap-2 px-6 py-3 border-b bg-[#f8f9fd] items-center'>
            <span className='text-xs text-gray-500 font-medium mr-2'>Trạng thái:</span>
            {['all', 'pending', 'approved', 'rejected'].map(s => (
              <button key={s}
                onClick={() => setHitlFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                  ${hitlFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                {s === 'all' ? 'Tất cả' : STATUS_LABEL[s]}
                {s === 'pending' && hitlLogs.filter(l => l.status === 'pending').length > 0 && (
                  <span className='ml-1.5 bg-yellow-500 text-white rounded-full px-1.5 py-0.5 text-xs'>
                    {hitlLogs.filter(l => l.status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Header */}
          <div className='max-sm:hidden grid grid-cols-[1.5fr_2fr_3fr_1fr_1fr_1.5fr] bg-[#f8f9fd] py-3 px-6 border-b items-center gap-4'>
            <p className='font-semibold'>Thời gian</p>
            <p className='font-semibold'>Lý do giữ lại</p>
            <p className='font-semibold'>Nội dung query</p>
            <p className='font-semibold'>Mức độ</p>
            <p className='font-semibold'>Trạng thái</p>
            <p className='font-semibold'>Hành động</p>
          </div>

          {/* Rows */}
          <div className='max-h-[70vh] overflow-y-scroll'>
            {filteredHitl.length > 0 ? filteredHitl.map((item, index) => (
              <div key={item._id || index}
                className='flex flex-col gap-2 max-sm:p-4 text-gray-600 py-3 px-6 border-b sm:grid sm:grid-cols-[1.5fr_2fr_3fr_1fr_1fr_1.5fr] items-center gap-4 hover:bg-gray-50'>

                <p className='text-gray-500 text-xs'>{new Date(item.created_at).toLocaleString('vi-VN')}</p>
                <p className='truncate text-xs' title={item.msg}>{item.msg}</p>
                <div className='truncate text-xs bg-gray-100 p-1 rounded font-mono' title={item.data}>{item.data}</div>

                <span className={`px-2 py-1 text-xs rounded-full font-medium border w-fit ${SEVERITY_STYLE[item.severity_label] || 'bg-gray-100 text-gray-600'}`}>
                  {item.severity_label}
                </span>

                <span className={`px-2 py-1 text-xs rounded-full font-medium w-fit ${STATUS_STYLE[item.status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABEL[item.status] || item.status}
                </span>

                <div className='flex gap-2 flex-wrap'>
                  {/* Chi tiết */}
                  <button onClick={() => setSelectedLogForDetail(item)}
                    className='bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-md border'
                    title='Xem chi tiết'>
                    <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                    </svg>
                  </button>

                  {/* Approve / Reject — chỉ hiện khi pending */}
                  {item.status === 'pending' && (
                    <>
                      <button
                        onClick={() => { setReviewModal({ item, action: 'approve' }); setReviewNote(''); }}
                        disabled={loadingId === item.unique_id}
                        className='bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1'>
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-3.5 w-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                        </svg>
                        Approve
                      </button>
                      <button
                        onClick={() => { setReviewModal({ item, action: 'reject' }); setReviewNote(''); }}
                        disabled={loadingId === item.unique_id}
                        className='bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1'>
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-3.5 w-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                        Reject
                      </button>
                    </>
                  )}

                  {/* Tư vấn AI */}
                  <button onClick={() => handleOpenChat(item)}
                    className='bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md'
                    title='Tư vấn AI'>
                    <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                  </button>
                </div>
              </div>
            )) : (
              <div className='p-8 text-center text-gray-500'>
                {hitlFilter === 'pending' ? 'Không có request nào đang chờ duyệt.' : 'Không có dữ liệu.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Floating ChatbotSec ───────────────────────────────────── */}
      <ChatbotSec logData={selectedLogForChat} isOpen={isChatOpen} setIsOpen={setIsChatOpen} />

      {/* ── Review Modal (Approve / Reject) ──────────────────────── */}
      {reviewModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4'>
          <div className='bg-white rounded-lg shadow-xl w-full max-w-md'>
            <div className='flex justify-between items-center px-6 py-4 border-b'>
              <h3 className={`text-base font-bold ${reviewModal.action === 'approve' ? 'text-green-700' : 'text-red-600'}`}>
                {reviewModal.action === 'approve' ? '✅ Xác nhận Approve' : '❌ Xác nhận Reject'}
              </h3>
              <button onClick={() => setReviewModal(null)} className='text-gray-400 hover:text-gray-600'>
                <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
            <div className='px-6 py-4 space-y-3'>
              <div className='bg-gray-50 rounded p-3 text-xs font-mono text-gray-700 border'>
                {reviewModal.item.data}
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Ghi chú (tuỳ chọn)</label>
                <textarea
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  rows={3}
                  placeholder='Lý do approve / reject...'
                  className='w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                />
              </div>
            </div>
            <div className='px-6 py-4 border-t flex justify-end gap-3'>
              <button onClick={() => setReviewModal(null)}
                className='px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 text-gray-700'>
                Huỷ
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={loadingId === reviewModal.item.unique_id}
                className={`px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-50
                  ${reviewModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}>
                {loadingId === reviewModal.item.unique_id ? 'Đang xử lý...' : reviewModal.action === 'approve' ? 'Xác nhận Approve' : 'Xác nhận Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal ──────────────────────────────────────────── */}
      {selectedLogForDetail && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md p-4'>
          <div className='bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden'>
            <div className='flex justify-between items-center bg-gray-50 border-b px-6 py-4'>
              <h3 className='text-lg font-bold text-gray-800'>Chi tiết Log Bảo mật</h3>
              <button onClick={() => setSelectedLogForDetail(null)} className='text-gray-400 hover:text-gray-600'>
                <svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
            <div className='p-6 overflow-y-auto flex-1 text-sm space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <p className='text-gray-500 font-medium mb-1'>Thời gian</p>
                  <p className='border bg-gray-50 rounded px-3 py-2'>{new Date(selectedLogForDetail.created_at).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <p className='text-gray-500 font-medium mb-1'>Mức độ</p>
                  <p className={`border rounded px-3 py-2 font-medium ${SEVERITY_STYLE[selectedLogForDetail.severity_label] || ''}`}>
                    {selectedLogForDetail.severity_label}
                  </p>
                </div>
                <div>
                  <p className='text-gray-500 font-medium mb-1'>Rule ID</p>
                  <p className='border bg-gray-50 rounded px-3 py-2'>{selectedLogForDetail.rule_id}</p>
                </div>
                <div>
                  <p className='text-gray-500 font-medium mb-1'>Nguồn (IP)</p>
                  <p className='border bg-gray-50 rounded px-3 py-2'>{selectedLogForDetail.source}</p>
                </div>
                {/* HITL-specific fields */}
                {selectedLogForDetail.rule_id === 'LAYER4_HITL' && (
                  <>
                    <div>
                      <p className='text-gray-500 font-medium mb-1'>Trạng thái</p>
                      <span className={`inline-block px-3 py-2 rounded text-sm font-medium ${STATUS_STYLE[selectedLogForDetail.status]}`}>
                        {STATUS_LABEL[selectedLogForDetail.status]}
                      </span>
                    </div>
                    {selectedLogForDetail.reviewed_by && (
                      <div>
                        <p className='text-gray-500 font-medium mb-1'>Reviewed by</p>
                        <p className='border bg-gray-50 rounded px-3 py-2'>{selectedLogForDetail.reviewed_by}</p>
                      </div>
                    )}
                    {selectedLogForDetail.review_note && (
                      <div className='md:col-span-2'>
                        <p className='text-gray-500 font-medium mb-1'>Ghi chú review</p>
                        <p className='border bg-gray-50 rounded px-3 py-2'>{selectedLogForDetail.review_note}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <p className='text-gray-500 font-medium mb-1'>Mô tả vi phạm</p>
                <p className='border bg-gray-50 rounded px-3 py-2'>{selectedLogForDetail.msg}</p>
              </div>
              <div>
                <p className='text-gray-500 font-medium mb-1'>Raw Data Payload</p>
                <pre className='bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono'>
                  {selectedLogForDetail.data}
                </pre>
              </div>
            </div>
            <div className='bg-gray-50 border-t px-6 py-4 flex justify-end gap-3'>
              <button onClick={() => { handleOpenChat(selectedLogForDetail); setSelectedLogForDetail(null); }}
                className='bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2'>
                <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                Đưa vào phân tích AI
              </button>
              <button onClick={() => setSelectedLogForDetail(null)}
                className='bg-white border hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg'>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logs;