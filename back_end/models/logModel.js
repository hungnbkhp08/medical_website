/**
 * Log Model — cập nhật thêm field cho Layer 4 HITL
 */
import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  unique_id:      { type: String },
  created_at:     { type: Date },
  user_id:        { type: String },
  data:           { type: String },   // query gốc
  msg:            { type: String },   // lý do bị log
  rule_id:        { type: String },   // LAYER1_PROMPT_INJECTION | LAYER3_* | LAYER4_HITL
  severity:       { type: String },
  severity_label: { type: String },
  source:         { type: String },   // IP — nguồn: 'X-Forwarded-For', 'X-Real-IP', 'remoteAddress', 'CF-Connecting-IP'
  isProxied:      { type: Boolean, default: false },
  ipSpoofed:      { type: Boolean, default: false },
  remoteAddr:     { type: String,  default: null },  // IP kết nối trực tiếp (không spoof được)

  // ── Field mở rộng cho LAYER4_HITL ──────────────────────────────
  status:         { type: String, enum: ['pending', 'approved', 'rejected'], default: null },
  conversation_id:{ type: String, default: null },
  dify_user:      { type: String, default: null },
  reviewed_by:    { type: String, default: null },   // admin user_id
  reviewed_at:    { type: Date,   default: null },
  review_note:    { type: String, default: null },
  dify_response:  { type: mongoose.Schema.Types.Mixed, default: null },

}, { collection: 'logs' });

const logModel = mongoose.models.log || mongoose.model('log', logSchema);

export default logModel;