import React, { useState } from "react";

const CompleteAppointmentModal = ({
  onClose,
  onConfirm,
  diagnosis,
  setDiagnosis,
  prescription,
  setPrescription,
  patientName,
  doctorName,
  slotTime,
}) => {
  const [step, setStep] = useState(1);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md font-sans">
      {step === 1 && (
        <>
          <h2 className="text-xl font-semibold mb-5 text-gray-800 border-b pb-2">
            🩺 Chẩn đoán
          </h2>

          <div className="space-y-2 text-sm text-gray-700">
            <p><strong>Bệnh nhân:</strong> {patientName || "—"}</p>
            <p><strong>Bác sĩ:</strong> {doctorName || "—"}</p>
            <p><strong>Thời gian hẹn:</strong> {slotTime || "—"}</p>
          </div>

          <label className="block mt-4 mb-2 text-sm font-medium text-gray-600">
            Thông tin chẩn đoán
          </label>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full border rounded-lg p-3 text-sm mb-5 focus:ring-2 focus:ring-green-500 outline-none resize-none"
            rows={3}
            placeholder="Nhập chẩn đoán..."
          />

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-sm cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-lg bg-[#5f6FFF] text-white hover:bg-[#4e5bbf] transition text-sm cursor-pointer"
            >
              Tiếp tục
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-xl font-semibold mb-5 text-gray-800 border-b pb-2">
            💊 Kê đơn thuốc
          </h2>

          {/* bảng thuốc động */}
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1 text-center w-12">STT</th>
                  <th className="border px-2 py-1">Tên thuốc</th>
                  <th className="border px-2 py-1 w-28">Đơn vị</th>
                  <th className="border px-2 py-1 w-20 text-center">Số lượng</th>
                  <th className="border px-2 py-1 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {prescription.map((row, index) => (
                  <tr key={index}>
                    <td className="border px-2 py-1 text-center">{index + 1}</td>
                    <td className="border px-2 py-1">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => {
                          const newPrescription = [...prescription];
                          newPrescription[index].name = e.target.value;
                          setPrescription(newPrescription);
                        }}
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder="Tên thuốc"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="text"
                        value={row.unit}
                        onChange={(e) => {
                          const newPrescription = [...prescription];
                          newPrescription[index].unit = e.target.value;
                          setPrescription(newPrescription);
                        }}
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder="Đơn vị"
                      />
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(e) => {
                          const newPrescription = [...prescription];
                          newPrescription[index].quantity = e.target.value;
                          setPrescription(newPrescription);
                        }}
                        className="w-full border rounded px-2 py-1 text-sm text-center"
                        placeholder="0"
                      />
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {index === prescription.length - 1 && (
                        <button
                          onClick={() =>
                            setPrescription([...prescription, { name: "", unit: "", quantity: "" }])
                          }
                          className="px-2 py-1 rounded bg-[#5f6FFF] text-white hover:bg-green-600 text-xs"
                        >
                          +
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-sm cursor-pointer"
            >
              Quay lại
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-[#5f6FFF] text-white hover:bg-[#4e5bbf] transition text-sm cursor-pointer"
            >
              Xác nhận
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CompleteAppointmentModal;
