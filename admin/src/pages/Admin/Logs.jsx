import React, { useContext, useEffect } from 'react';
import { AdminContext } from '../../context/AdminContext';

const Logs = () => {
    const { aToken, logs, getLogs } = useContext(AdminContext);

    useEffect(() => {
        if (aToken) {
            getLogs();
        }
    }, [aToken]);

    return (
        <div className='w-full max-w-6xl m-5'>
            <p className='mb-3 text-lg font-medium'>Hệ thống Logs bảo mật</p>
            <div className='bg-white border rounded text-sm max-h-[80vh] min-h-[50vh] overflow-y-scroll'>
                <div className='max-sm:hidden grid grid-cols-[1.5fr_1fr_2fr_3fr_1fr_1fr] bg-[#f8f9fd] py-3 px-6 border-b items-center gap-4'>
                    <p className='font-semibold'>Thời gian</p>
                    <p className='font-semibold'>Mã Rule</p>
                    <p className='font-semibold'>Mô tả</p>
                    <p className='font-semibold'>Dữ liệu chi tiết</p>
                    <p className='font-semibold'>Mức độ</p>
                    <p className='font-semibold'>Nguồn</p>
                </div>
                {logs && logs.length > 0 ? (
                    logs.map((item, index) => (
                        <div className={`flex flex-col gap-2 max-sm:p-4 text-gray-600 py-3 px-6 border-b sm:grid sm:grid-cols-[1.5fr_1fr_2fr_3fr_1fr_1fr] items-center gap-4 hover:bg-gray-50 ${item.severity_label === 'CRITICAL' ? 'bg-red-50' : ''}`} key={item._id || index}>
                            {/* Mobile view top row */}
                            <div className='sm:hidden flex justify-between w-full'>
                                <p className='text-gray-800 font-medium'>{new Date(item.created_at).toLocaleString()}</p>
                                <p className={`px-2 py-1 text-xs rounded-full font-medium ${item.severity_label === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {item.severity_label}
                                </p>
                            </div>
                            
                            {/* Desktop/Tablet view columns */}
                            <p className='max-sm:hidden text-gray-500'>
                                {new Date(item.created_at).toLocaleString('vi-VN')}
                            </p>
                            <p>
                                <span className="sm:hidden font-semibold mr-1">Rule ID:</span>
                                {item.rule_id}
                            </p>
                            <p className='truncate' title={item.msg}>
                                <span className="sm:hidden font-semibold mr-1">Mô tả:</span>
                                {item.msg}
                            </p>
                            <div className='truncate max-w-full text-xs bg-gray-100 p-1 rounded font-mono' title={item.data}>
                                {item.data}
                            </div>
                            <p className={`hidden sm:block px-2 py-1 text-xs rounded-full text-center w-fit font-medium ${item.severity_label === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                                {item.severity_label}
                            </p>
                            <p>
                                <span className="sm:hidden font-semibold mr-1">Nguồn:</span>
                                {item.source}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        Hệ thống chưa ghi nhận log nào.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Logs;
