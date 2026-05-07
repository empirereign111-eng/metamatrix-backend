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

// 👉 Daily Usage Reset Logic (Strict Control)
const checkAndResetUsage = async (user) => {
  const now = new Date();
  const lastReset = user.lastResetDate ? new Date(user.lastResetDate) : new Date(0);

  // যদি আজকের দিনটি শেষ রিসেট দিনের থেকে আলাদা হয়
  if (now.toDateString() !== lastReset.toDateString()) {
    user.usageCount = 0; // বর্তমান দিনের ব্যবহার ০ করে দাও
    user.lastResetDate = now; // রিসেট ডেট আজ করে দাও
    await user.save();
    return true;
  }
  return false;
};

// JWT Verification Middleware
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // প্রতি রিকোয়েস্টে ডেইলি রিসেট চেক করা হবে
    await checkAndResetUsage(user);
    
    req.user = user;
    req.role = decoded.role;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') throw new Error();
    next();
  } catch (err) {
    res.status(403).json({ error: 'Admin access required' });
  }
};

/* =========================
   USER ROUTES
========================= */

// Registration & OTP Routes (Same as before)
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
      usageCount: 0, maxLimit: 10, planName: 'Free Plan' // Default settings
    });

    await transporter.sendMail({
      from: `"MetaMatrix" <${process.env.EMAIL_USER}>`,
      to: email, subject: 'Verify OTP', text: `Your OTP: ${otp}`,
    });

    res.json({ message: 'OTP sent' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// User Login (Login হলেই রিসেট হবে)
app.post('/api/login/user', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(401).json({ error: 'Invalid Credentials' });
    if (!user.isVerified) return res.status(403).json({ error: 'Verify first' });
    if (!user.isApproved) return res.json({ status: 'pending', message: 'Waiting for Admin approval' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid Credentials' });

    // চেক এবং রিসেট ডেইলি লিমিট
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

// 👉 Usage Increment API (Strict Limit Enforcement)
app.post('/api/usage/increment', authenticateUser, async (req, res) => {
  try {
    const user = req.user;

    // ১. চেক করো লিমিট শেষ কি না (এডমিন যেটা সেট করেছে)
    if (user.maxLimit !== -1 && user.usageCount >= user.maxLimit) {
      return res.status(403).json({ error: 'Limit Over', message: 'Admin defined limit reached.' });
    }

    // ২. লিমিট থাকলে কাউন্ট বাড়াও
    user.usageCount += 1;
    user.usageTotal = (user.usageTotal || 0) + 1;
    await user.save();

    res.json({ success: true, currentUsage: user.usageCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// User Refresh Data (Frontend calls this)
app.get('/api/me', authenticateUser, (req, res) => {
  res.json({ user: req.user });
});

/* =========================
   ADMIN LOGIN (Same as before)
========================= */
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
      usageCount: 0 // Approve করার সময় রিসেট করে দাও
    });
    res.json({ message: 'User approved/updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/users/:id/block', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.status = user.status === 'blocked' ? 'active' : 'blocked';
    await user.save();
    res.json({ message: `User ${user.status}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/users/:id/delete', authenticateAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* =========================
   OTP & VERIFICATION
========================= */
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email, otp });
    if (!user || user.otpExpiry < Date.now()) return res.status(400).json({ error: 'Invalid or expired OTP' });
    
    user.isVerified = true;
    user.otp = undefined;
    await user.save();
    res.json({ message: 'Email verified' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT} 🚀`));