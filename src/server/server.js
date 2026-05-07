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
   PROFESSIONAL EMAIL TEMPLATE
========================= */
const sendOTPEmail = async (email, otp, name) => {
    const mailOptions = {
        // 👉 Professional Header (Hides raw email in display name)
        from: '"MetaMatrix Security"', 
        to: email,
        subject: `${otp} is your MetaMatrix verification code`,
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; padding: 0; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #1A0B2E; padding: 30px 20px; text-align: center;">
                <h1 style="color: #22D3EE; margin: 0; font-size: 28px; letter-spacing: 2px;">MetaMatrix</h1>
            </div>
            <div style="padding: 40px 30px; color: #333333;">
                <h2 style="margin-top: 0; color: #1A0B2E; font-size: 20px;">Verify your email</h2>
                <p style="font-size: 15px; line-height: 1.6;">Hi <strong>${name || 'there'}</strong>,</p>
                <p style="font-size: 15px; line-height: 1.6;">To complete your registration and secure your account, please use the following 6-digit verification code:</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <div style="display: inline-block; padding: 15px 30px; background-color: #F3F4F6; border: 2px dashed #8B5CF6; border-radius: 8px;">
                        <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1A0B2E;">${otp}</span>
                    </div>
                </div>
                
                <p style="font-size: 14px; color: #666666;">This code will expire in <strong>5 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
                <p style="font-size: 13px; color: #999999; text-align: center;">This is an automated security message. Please do not reply.</p>
            </div>
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                © 2026 MetaMatrix Systems. All rights reserved.
            </div>
        </div>
        `
    };
    return transporter.sendMail(mailOptions);
};

/* =========================
   CORE LOGIC & MIDDLEWARE
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
   AUTH & VERIFICATION ROUTES
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

// Verification Logic (With Robust Sanitization)
const verifyLogic = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

        const cleanEmail = email.toLowerCase().trim();
        const cleanOtp = otp.toString().trim().replace(/\s/g, ''); 

        const user = await User.findOne({ email: cleanEmail, otp: cleanOtp });

        if (!user) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        if (user.otpExpiry < Date.now()) {
            return res.status(400).json({ error: 'Code has expired. Please resend.' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully! Please wait for Admin approval.' });
    } catch (err) { res.status(500).json({ error: 'Server error during verification' }); }
};

// 👉 Multiple Aliases to prevent 404/JSON Error
app.post('/api/verify-otp', verifyLogic);
app.post('/api/verify-email', verifyLogic);

// Resend OTP
const resendLogic = async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required' });
      
      const cleanEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: cleanEmail });
      if (!user) return res.status(404).json({ error: 'User not found' });
  
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiry = Date.now() + 5 * 60 * 1000;
      await user.save();
  
      await sendOTPEmail(cleanEmail, otp, user.name);
      res.json({ message: 'New OTP sent to your email' });
    } catch (err) { res.status(500).json({ error: 'Failed to resend OTP' }); }
};

app.post('/api/resend-otp', resendLogic);
app.post('/api/auth/resend-otp', resendLogic); // Alias

/* =========================
   LOGIN & USAGE ROUTES
========================= */

// User Login
app.post('/api/login/user', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) return res.status(401).json({ error: 'Invalid Credentials' });
    if (!user.isVerified) return res.status(403).json({ error: 'Verify first' });
    if (!user.isApproved) return res.json({ status: 'pending', message: 'Waiting for Admin approval' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid Credentials' });

    await checkAndResetUsage(user);

    const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, role: 'user', user: { 
      name: user.name, 
      email: user.email,
      usageCount: user.usageCount,
      maxLimit: user.maxLimit,
      planName: user.planName,
      accessEnd: user.accessEnd
    }});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin Login (Smart Hash Check)
app.post('/api/login/admin', async (req, res) => {
    try {
      const { email, password, pin } = req.body;
      if (email !== process.env.ADMIN_EMAIL) return res.status(401).json({ error: 'Invalid Admin' });
  
      const isPassValid = process.env.ADMIN_PASS.startsWith('$2b$') ? await bcrypt.compare(password, process.env.ADMIN_PASS) : (password === process.env.ADMIN_PASS);
      const isPinValid = process.env.ADMIN_PIN.startsWith('$2b$') ? await bcrypt.compare(pin, process.env.ADMIN_PIN) : (pin === process.env.ADMIN_PIN);
  
      if (isPassValid && isPinValid) {
        const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, role: 'admin', user: { name: 'Admin', email } });
      }
      res.status(401).json({ error: 'Invalid Admin Credentials' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Usage Increment
app.post('/api/usage/increment', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    if (user.maxLimit !== -1 && user.usageCount >= user.maxLimit) {
      return res.status(403).json({ error: 'Limit Over' });
    }
    user.usageCount += 1;
    user.usageTotal = (user.usageTotal || 0) + 1;
    await user.save();
    res.json({ success: true, currentUsage: user.usageCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* =========================
   ADMIN PANEL ROUTES
========================= */

app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/users/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const { plan, accessStart, accessEnd, maxLimit, limitType } = req.body;
    await User.findByIdAndUpdate(req.params.id, {
      isApproved: true,
      status: 'active',
      planName: plan,
      accessStart,
      accessEnd,
      maxLimit,
      limitType,
      usageCount: 0 
    });
    res.json({ message: 'User approved/updated' });
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