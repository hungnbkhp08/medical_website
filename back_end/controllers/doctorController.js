import doctorModel from "../models/doctorModel.js";

const changeAvailablity=async (req,res) =>{
    try{
        const {docId}=req.body
        const docData= await doctorModel.findById(docId);
        await doctorModel.findByIdAndUpdate(docId,{available:!docData.available})
        res.json({success:true,message:'Availablity Change'})
    }
    catch (error) {
        console.error( error);
        res.json({ success: false, message:error.message});
    }
}
const getListDoctor =async (req,res) =>{
    try{
        const doctors=await doctorModel.find({}).select(['-password','-email'])
        res.json({success:true,doctors})
    }
    catch (error) {
        console.error( error);
        res.json({ success: false, message:error.message});
    }
}
export {changeAvailablity,getListDoctor}