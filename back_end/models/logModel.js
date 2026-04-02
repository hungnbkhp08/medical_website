import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
    unique_id: { type: String },
    created_at: { type: Date },
    data: { type: String },
    msg: { type: String },
    rule_id: { type: String },
    severity: { type: String },
    severity_label: { type: String },
    source: { type: String }
}, { collection: 'logs' });

const logModel = mongoose.models.log || mongoose.model('log', logSchema);

export default logModel;
