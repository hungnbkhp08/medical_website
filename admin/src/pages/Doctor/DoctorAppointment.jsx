import React, { useEffect, useState, useContext } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import CompleteAppointmentModal from './CompleteAppointmentModal';

const DoctorAppointment = () => {
    const { getAppointments, appointments, dToken, cancelAppointment,completeAppointment } = useContext(DoctorContext);
    const { caculateAge, slotDateFormat, currency } = useContext(AppContext);

    const [openModal, setOpenModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [diagnosis, setDiagnosis] = useState("");
    const [prescription, setPrescription] = useState([
        { name: "", unit: "", quantity: "" },
    ]);

    useEffect(() => {
        if (dToken) {
            getAppointments();
        }
    }, [dToken]);

    // mở popup + set dữ liệu của lịch hẹn được chọn
    const handleOpenModal = (appointment) => {
        setSelectedAppointment(appointment);
        setOpenModal(true);
    };

    const handleConfirmComplete = () => {
        if (!selectedAppointment) return;

         completeAppointment(selectedAppointment._id,
            diagnosis,
            prescription)
        // reset
        setDiagnosis("");
        setPrescription([{ name: "", unit: "", quantity: "" }]);
        setSelectedAppointment(null);
        setOpenModal(false);
    };

    return (
        <div className="w-full max-w-6xl m-5 relative">
            <p className="mb-3 text-lg font-medium">All Appointments</p>

            <div className="bg-white border rounded text-sm max-h-[80vh] min-h-[60vh] overflow-y-scroll">
                <div className="hidden sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b">
                    <p>#</p>
                    <p>Patient</p>
                    <p>Payment</p>
                    <p>Age</p>
                    <p>Date & Time</p>
                    <p>Fee</p>
                    <p>Action</p>
                </div>

                {appointments.slice().reverse().map((item, index) => (
                    <div
                        key={index}
                        className="flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50"
                    >
                        <p className="max-sd:hidden">{index + 1}</p>
                        <div className="flex items-center gap-2">
                            <img className="w-8 rounded-full" src={item.userData.image} alt="" />
                            <p>{item.userData.name}</p>
                        </div>
                        <p className="text-xs inline border px-2 rounded-full w-fit">
                            {item.payment ? 'Online' : 'CASH'}
                        </p>
                        <p className="max-sd:hidden">{caculateAge(item.userData.dob)}</p>
                        <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
                        <p>{currency}{item.amount}</p>
                        {item.cancelled ? (
                            <p className="text-red-400 text-xs font-medium">Cancelled</p>
                        ) : item.isCompleted ? (
                            <p className="text-green-500 text-xs font-medium">Completed</p>
                        ) : (
                            <div className="flex items-center gap-2">
                                {item.payment && (
                                    <p className="text-blue-500 text-xs font-medium">Paid</p>
                                )}
                                <img
                                    onClick={() => cancelAppointment(item._id)}
                                    className="w-10 cursor-pointer"
                                    src={assets.cancel_icon}
                                    alt="Cancel"
                                />
                                <img
                                    onClick={() => handleOpenModal(item)}
                                    className="w-10 cursor-pointer"
                                    src={assets.tick_icon}
                                    alt="Complete"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Popup overlay + modal */}
            {openModal && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-lg">
                        <CompleteAppointmentModal
                            onClose={() => setOpenModal(false)}
                            onConfirm={handleConfirmComplete}
                            diagnosis={diagnosis}
                            setDiagnosis={setDiagnosis}
                            prescription={prescription}
                            setPrescription={setPrescription}
                            patientName={selectedAppointment?.userData?.name || ""}
                            doctorName={selectedAppointment?.docData?.name || ""}
                            slotTime={
                                selectedAppointment
                                    ? `${slotDateFormat(selectedAppointment.slotDate)}, ${selectedAppointment.slotTime}`
                                    : ""
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorAppointment;
