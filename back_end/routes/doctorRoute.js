import express from 'express';
import { getListDoctor } from '../controllers/doctorController.js';
const doctorRouter=express.Router()
doctorRouter.get('/list',getListDoctor)
export default doctorRouter