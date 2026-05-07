const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // ভেরিফিকেশন এবং অ্যাপ্রুভাল
  isVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  
  // ইউজার স্ট্যাটাস (active, pending, blocked)
  status: { type: String, default: 'pending' }, 
  
  // ওটিপি (OTP) ম্যানেজমেন্ট
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },

  // প্ল্যান এবং অ্যাক্সেস ডিটেইলস (Admin Panel এর জন্য)
  planName: { type: String, default: 'Free Plan' },
  accessStart: { type: Date, default: null },
  accessEnd: { type: Date, default: null },
  
  // ফাইল জেনারেশন লিমিট লজিক
  maxLimit: { type: Number, default: 10 }, // -1 মানে আনলিমিটেড
  limitType: { type: String, default: 'daily' }, // daily, monthly, unlimited
  
  // ইউজেজ ট্র্যাকিং (কতগুলো ফাইল জেনারেট করেছে)
  usageToday: { type: Number, default: 0 },
  usageTotal: { type: Number, default: 0 },
  lastUsageReset: { type: Date, default: Date.now }

}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;