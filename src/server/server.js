require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const User = require('./models/User');

const app = express();

/* =========================
   CORS & MIDDLEWARE
========================= */
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());

/* =========================
   DB CONNECT
========================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected ✅'))
  .catch(err => console.error('MongoDB error ❌', err.message));

/* =========================
   EMAIL SETUP
========================= */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* =========================
   PROFESSIONAL EMAIL TEMPLATE (Verified Name Fix)
========================= */
const sendOTPEmail = async (email, otp, name) => {
    const mailOptions = {
        // 👉 FIX: Display Name format with brackets ensures Gmail shows MetaMatrix Support
        from: `"MetaMatrix Support" <${process.env.EMAIL_USER}>`, 
        to: email,
        subject: `${otp} is your verification code`,
        html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #1A0B2E; padding: 30px; text-align: center;">
                <h1 style="color: #22D3EE; margin: 0;">MetaMatrix</h1>
            </div>
            <div style="padding: 40px 30px; color: #333333;">
                <p>Hi <strong>${name || 'there'}</strong>,</p>
                <p>To secure your account, please use this 6-digit verification code:</p>
                <div style="text-align: center; margin: 35px 0;">
                    <div style="display: inline-block; padding: 15px 30px; background-color: #F3F4F6; border: 2px dashed #8B5CF6; border-radius: 8px;">
                        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1A0B2E;">${otp}</span>
                    </div>
                </div>
                <p style="font-size: 14px; color: #666666;">This code is valid for 5 minutes.</p>
            </div>
        </div>
        `
    };
    return transporter.sendMail(mailOptions);
};

/* =========================
   CORE LOGIC
========================= */
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const checkAndResetUsage = async (user) => {
  const now = new Date();
  const lastReset = user.lastResetDate ? new Date(user.lastResetDate) : new Date(0);
  if (now.toDateString() !== lastReset.toDateString()) {
    user.usageCount = 0;
    user.lastResetDate = now;
    await user.save();
    return true;
  }
  return false;
};

// Middleware
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await checkAndResetUsage(user);
    req.user = user;
    req.role = decoded.role;
    next();
  } catch (err) { res.status(403).json({ error: 'Invalid token' }); }
};

const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') throw new Error();
    next();
  } catch (err) { res.status(403).json({ error: 'Admin access required' }); }
};

/* =========================
   AUTH & VERIFICATION (FIXED)
========================= */

// Registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });
    if (user && user.isVerified) return res.status(400).json({ error: 'Already registered' });
    if (user && !user.isVerified) await User.deleteOne({ email: cleanEmail });

    const hashed = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    user = await User.create({
      name, email: cleanEmail, password: hashed, isVerified: false, isApproved: false,
      otp, otpExpiry: Date.now() + 5 * 60 * 1000,
      usageCount: 0, maxLimit: 10, planName: 'Free Plan'
    });

    await sendOTPEmail(cleanEmail, otp, name);
    res.json({ message: 'OTP sent' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Resend OTP Logic
const resendLogic = async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required' });
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) return res.status(404).json({ error: 'User not found' });
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiry = Date.now() + 5 * 60 * 1000;
      await user.save();
      await sendOTPEmail(user.email, otp, user.name);
      res.json({ message: 'New code sent!' });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
};
app.post('/api/resend-otp', resendLogic);
app.post('/api/auth/resend-otp', resendLogic);
app.post('/api/verify-resend', resendLogic);

// 👉 VERIFY LOGIC (Catch-All Protection)
const verifyLogic = async (req, res) => {
    try {
        // টার্মিনালে লগ করবে যাতে আপনি দেখতে পারেন ফ্রন্টএন্ড কী পাঠাচ্ছে
        console.log("--- OTP Verification Request ---");
        console.log("Body:", req.body);

        const { email, otp, code, verificationCode } = req.body;
        const targetOtp = (otp || code || verificationCode)?.toString().trim();
        
        if (!email || !targetOtp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        const user = await User.findOne({ 
            email: email.toLowerCase().trim(), 
            otp: targetOtp 
        });

        if (!user) return res.status(400).json({ error: 'Invalid verification code' });
        if (user.otpExpiry < Date.now()) return res.status(400).json({ error: 'Code expired' });

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.json({ message: 'Email verified! Please wait for Admin approval.' });
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
};

// 👉 All Possible Routes to fix 404 Unexpected Token Error
app.post('/api/verify-otp', verifyLogic);
app.post('/api/verify-email', verifyLogic);
app.post('/api/verify-code', verifyLogic);
app.post('/api/auth/verify', verifyLogic);

/* =========================
   OTHER ROUTES
========================= */

app.post('/api/login/user', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid Credentials' });
    if (!user.isVerified) return res.status(403).json({ error: 'Verify first' });
    if (!user.isApproved) return res.json({ status: 'pending', message: 'Waiting for Admin approval' });
    if (await bcrypt.compare(password, user.password)) {
      await checkAndResetUsage(user);
      const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, role: 'user', user: { name: user.name, email: user.email, usageCount: user.usageCount, maxLimit: user.maxLimit, planName: user.planName, accessEnd: user.accessEnd }});
    }
    res.status(401).json({ error: 'Invalid Credentials' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/usage/increment', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    if (user.maxLimit !== -1 && user.usageCount >= user.maxLimit) return res.status(403).json({ error: 'Limit Over' });
    user.usageCount += 1;
    user.usageTotal = (user.usageTotal || 0) + 1;
    await user.save();
    res.json({ success: true, currentUsage: user.usageCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin Panel Routes
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/users/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const { plan, accessStart, accessEnd, maxLimit, limitType } = req.body;
    await User.findByIdAndUpdate(req.params.id, { isApproved: true, status: 'active', planName: plan, accessStart, accessEnd, maxLimit, limitType, usageCount: 0 });
    res.json({ message: 'User approved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/users/:id/delete', authenticateAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT} 🚀`));