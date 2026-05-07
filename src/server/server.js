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
   HELPER FUNCTIONS & LOGIC
========================= */
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 👉 professional HTML Email Template
const sendOTPEmail = async (email, otp, name) => {
    const mailOptions = {
        from: `"MetaMatrix Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your Email - MetaMatrix',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px;">
            <div style="text-align: center; border-bottom: 2px solid #8B5CF6; padding-bottom: 20px;">
                <h1 style="color: #8B5CF6; margin: 0;">MetaMatrix</h1>
            </div>
            <div style="padding: 20px 0;">
                <p style="font-size: 16px; color: #333;">Hello <strong>${name || 'User'}</strong>,</p>
                <p style="font-size: 16px; color: #333;">Thank you for joining MetaMatrix. To complete your registration, please use the following verification code:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1A0B2E; background: #f3f4f6; padding: 10px 20px; border-radius: 5px; border: 1px dashed #8B5CF6;">${otp}</span>
                </div>
                <p style="font-size: 14px; color: #666;">This code is valid for <strong>5 minutes</strong>. If you didn't request this code, please ignore this email.</p>
            </div>
            <div style="text-align: center; border-top: 1px solid #e0e0e0; padding-top: 20px; color: #999; font-size: 12px;">
                <p>&copy; 2026 MetaMatrix Systems. All rights reserved.</p>
            </div>
        </div>
        `
    };
    return transporter.sendMail(mailOptions);
};

// Daily Usage Reset Logic
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
   AUTH ROUTES
========================= */

// Registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

    let user = await User.findOne({ email });
    if (user && user.isVerified) return res.status(400).json({ error: 'Already registered' });
    if (user && !user.isVerified) await User.deleteOne({ email });

    const hashed = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    user = await User.create({
      name, email, password: hashed, isVerified: false, isApproved: false,
      otp, otpExpiry: Date.now() + 5 * 60 * 1000,
      usageCount: 0, maxLimit: 10, planName: 'Free Plan'
    });

    await sendOTPEmail(email, otp, name); // Professional Email
    res.json({ message: 'OTP sent' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Resend OTP
app.post('/api/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save();

    await sendOTPEmail(email, otp, user.name);
    res.json({ message: 'New OTP sent to your email' });
  } catch (err) { res.status(500).json({ error: 'Failed to resend OTP' }); }
});

// Verify OTP (Alias supported)
const verifyLogic = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email, otp });
        if (!user) return res.status(400).json({ error: 'Invalid verification code' });
        if (user.otpExpiry < Date.now()) return res.status(400).json({ error: 'Code expired' });
        
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();
        res.json({ message: 'Email verified successfully! Please wait for Admin approval.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

app.post('/api/verify-otp', verifyLogic);
app.post('/api/verify-email', verifyLogic); // Alias to prevent frontend 404

// Login
app.post('/api/login/user', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid Credentials' });
    if (!user.isVerified) return res.status(403).json({ error: 'Verify first' });
    if (!user.isApproved) return res.json({ status: 'pending', message: 'Waiting for Admin approval' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid Credentials' });

    await checkAndResetUsage(user);

    const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, role: 'user', user: { name: user.name, email: user.email, usageCount: user.usageCount, maxLimit: user.maxLimit, planName: user.planName, accessEnd: user.accessEnd }});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin Panel & Other Routes
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