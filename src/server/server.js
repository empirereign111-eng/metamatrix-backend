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
   HELPER FUNCTIONS
========================= */
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// JWT ভেরিফিকেশন মিডলওয়্যার (অ্যাডমিন সিকিউরিটির জন্য)
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
    });

    await transporter.sendMail({
      from: `"MetaMatrix" <${process.env.EMAIL_USER}>`,
      to: email, subject: 'Verify OTP', text: `Your OTP: ${otp}`,
    });

    res.json({ message: 'OTP sent' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// User Login
app.post('/api/login/user', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(401).json({ error: 'Invalid Credentials' });
    if (!user.isVerified) return res.status(403).json({ error: 'Verify first' });
    if (!user.isApproved) return res.json({ status: 'pending', message: 'Waiting for Admin approval' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid Credentials' });

    const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, role: 'user', user: { name: user.name, email: user.email } });
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

/* =========================
   ADMIN PANEL ROUTES (Updated)
========================= */

// সব ইউজার লিস্ট [cite: 34]
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ইউজার ডিটেইলস (Usage সহ) [cite: 13]
app.get('/api/admin/user/:id/details', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json({
      usage: {
        today: user.usageToday || 0,
        max: user.maxLimit || 10,
        total: user.usageTotal || 0
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// এপ্রুভ বা প্ল্যান আপডেট করা [cite: 32, 178-179]
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
      limitType
    });
    res.json({ message: 'User approved/updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// প্ল্যান এডিট করার রাউট (frontend 'plan' action পাঠায়)
app.put('/api/admin/users/:id/plan', authenticateAdmin, async (req, res) => {
  try {
    const { planName, accessStart, accessEnd, maxLimit, limitType } = req.body;
    await User.findByIdAndUpdate(req.params.id, { planName, accessStart, accessEnd, maxLimit, limitType });
    res.json({ message: 'Plan updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ইউজার ব্লক/আনব্লক করা [cite: 129]
app.put('/api/admin/users/:id/block', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.status = user.status === 'blocked' ? 'active' : 'blocked';
    await user.save();
    res.json({ message: `User ${user.status}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ইউজার ডিলিট করা [cite: 42, 130]
app.delete('/api/admin/users/:id/delete', authenticateAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* =========================
   ANALYTICS ROUTES [cite: 9]
========================= */
app.get('/api/admin/analytics/summary', authenticateAdmin, async (req, res) => {
  const totalUsers = await User.countDocuments();
  res.json({ totalUsers, activeUsers: 5, totalFiles: 120 }); // Example data
});

app.get('/api/admin/analytics/top-users', authenticateAdmin, async (req, res) => {
  res.json([]); // Example placeholder
});

app.get('/api/admin/analytics/model-usage', authenticateAdmin, async (req, res) => {
  res.json([]); // Example placeholder
});

/* =========================
   OTHERS
========================= */
app.post('/api/verify-email', async (req, res) => { /* ... existing ... */ });
app.post('/api/forgot-password', async (req, res) => { /* ... existing ... */ });
app.post('/api/reset-password', async (req, res) => { /* ... existing ... */ });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT} 🚀`));