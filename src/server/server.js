require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// File Upload Config
const upload = multer({ dest: 'uploads/' });

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

const JWT_SECRET = process.env.JWT_SECRET || 'MetaMatrix@Secure#2026!#X9pL2@Z';

/* =========================
   CORS & MIDDLEWARE
========================= */
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());
app.use('/uploads', express.static('uploads')); 

/* =========================
   DB CONNECT & MODELS
========================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected ✅'))
  .catch(err => console.error('MongoDB error ❌', err.message));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['pending', 'active', 'blocked', 'pending_request', 'expired'], default: 'pending' },
  accessStart: { type: Date },
  accessEnd: { type: Date },
  planName: { type: String },
  requestedPlan: { type: String, default: null },
  deviceId: { type: String, default: null },
  usageCount: { type: Number, default: 0 },
  dailyUsageCount: { type: Number, default: 0 },
  lastUsageDate: { type: Date, default: null },
  lastUsageReset: { type: Date, default: Date.now },
  maxLimit: { type: Number, default: 10 },
  limitType: { type: String, enum: ['daily', 'monthly', 'unlimited'], default: 'daily' },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String, default: null },
  verificationExpires: { type: Date, default: null },
  resetPasswordCode: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

const generationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  model: String,
  createdAt: { type: Date, default: Date.now }
});
const GenerationLog = mongoose.models.GenerationLog || mongoose.model('GenerationLog', generationLogSchema);

/* =========================
   EMAIL SETUP (Branding & Layout Like Image 1.jpeg)
========================= */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (email, code, type, name = '') => {
  const isReset = type === 'reset';
  const subject = isReset ? 'Reset Your MetaMatrix Password' : 'Verify Your Email - MetaMatrix';
  
  // Icon Path (Make sure icon.ico is in your root folder)
  const iconPath = path.join(__dirname, 'icon.ico');
  const attachments = [];
  if (fs.existsSync(iconPath)) {
    attachments.push({
      filename: 'logo.png',
      path: iconPath,
      cid: 'applogo' 
    });
  }

  const mailOptions = {
    from: `"MetaMatrix Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    attachments: attachments,
    html: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #1A0B2E; padding: 40px 20px; text-align: center;">
            <img src="cid:applogo" style="width: 60px; height: 60px; margin-bottom: 10px; border-radius: 12px;" alt="Logo">
            <h1 style="color: #22D3EE; margin: 0; font-size: 32px; letter-spacing: 2px; font-weight: 800;">MetaMatrix</h1>
        </div>
        
        <div style="padding: 40px 35px; color: #333333; border-bottom: 1px solid #f0f0f0;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hello <strong>${name || 'Gaming World'}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.6; color: #555;">
                ${isReset ? 'We received a request to reset your password. Use the following code to continue:' : 'Thank you for joining MetaMatrix. To complete your registration, please use the following verification code:'}
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
                <div style="display: inline-block; padding: 20px 40px; border: 2px dashed #8B5CF6; border-radius: 12px; background-color: #F8F7FF;">
                    <span style="font-size: 42px; font-weight: 900; letter-spacing: 8px; color: #1A0B2E;">${code}</span>
                </div>
            </div>
            
            <p style="font-size: 14px; color: #777; line-height: 1.5;">
                This code is valid for <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
            </p>
        </div>
        
        <div style="background-color: #ffffff; padding: 25px; text-align: center; color: #999999; font-size: 12px;">
            <p style="margin: 0;">© 2026 MetaMatrix Systems. All rights reserved.</p>
        </div>
    </div>`,
  };
  return transporter.sendMail(mailOptions);
};

/* =========================
   CORE LOGIC & HELPERS
========================= */
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const checkAndResetUserUsage = async (user) => {
  if (!user || user.limitType === 'unlimited' || user.maxLimit === -1) return user;
  const now = new Date();
  let shouldReset = false;
  const resetTime = user.lastUsageReset ? new Date(user.lastUsageReset) : new Date(0);

  if (user.limitType === 'daily' && resetTime.toDateString() !== now.toDateString()) {
      shouldReset = true;
  } else if (user.limitType === 'monthly' && (resetTime.getMonth() !== now.getMonth() || resetTime.getFullYear() !== now.getFullYear())) {
      shouldReset = true;
  }

  if (shouldReset) {
    user.dailyUsageCount = 0;
    user.usageCount = 0;
    user.lastUsageReset = now;
    await user.save();
  }
  return user;
};

/* =========================
   SOCKET.IO
========================= */
const activeSockets = new Map();
io.on('connection', (socket) => {
  socket.on('join-admin', (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role === 'admin') socket.join('admin-room');
    } catch (err) { socket.disconnect(); }
  });
  socket.on('user:online', (data) => {
    try {
      const decoded = jwt.verify(data.token, JWT_SECRET);
      activeSockets.set(socket.id, { userId: decoded.userId, email: decoded.email });
      io.to('admin-room').emit('user:join', { socketId: socket.id, email: decoded.email });
    } catch(err) {}
  });
  socket.on('disconnect', () => {
    activeSockets.delete(socket.id);
    io.to('admin-room').emit('user:offline', { socketId: socket.id });
  });
});

/* =========================
   MIDDLEWARES
========================= */
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') throw new Error();
    next();
  } catch (err) { res.status(403).json({ error: 'Admin access required' }); }
};

const usageLimitMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    let user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await checkAndResetUserUsage(user);
    if (user.status !== 'active') return res.status(403).json({ message: 'Account not active' });
    if (user.maxLimit !== -1 && user.usageCount >= user.maxLimit) return res.status(403).json({ message: 'Limit reached' });
    req.user = user;
    next();
  } catch (e) { res.status(401).json({ error: 'Invalid token' }); }
};

/* =========================
   AUTH & VERIFICATION (Synced with UserLogin.tsx)
========================= */

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });
    if (user) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = generateCode();
    user = new User({
      name: name.trim(), email: cleanEmail, password: hashedPassword, isVerified: false,
      verificationCode: code, verificationExpires: new Date(Date.now() + 10 * 60 * 1000)
    });
    await user.save();
    await sendEmail(cleanEmail, code, 'verify', name);
    res.status(201).json({ message: 'OTP sent to email', status: 'unverified' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/verify-email', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Missing fields' });
  try {
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(), 
      verificationCode: code.toString().trim(), 
      verificationExpires: { $gt: new Date() } 
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired code' });
    user.isVerified = true; user.verificationCode = null; user.verificationExpires = null;
    await user.save();
    res.json({ message: 'Verified successfully!' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/resend-verification', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const code = generateCode();
    user.verificationCode = code; user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendEmail(user.email, code, 'verify', user.name);
    res.json({ message: 'Code resent' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

/* =========================
   LOGIN & ADMIN (Fixed PIN)
========================= */

app.post('/api/login/user', async (req, res) => {
  const { email, password, deviceId } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isVerified) return res.status(403).json({ status: 'unverified' });
    if (user.status === 'blocked') return res.status(403).json({ message: 'Blocked' });
    if (user.status === 'pending') return res.json({ status: 'pending', message: 'Waiting for Admin approval' });

    if (!user.deviceId) {
      user.deviceId = deviceId; await user.save();
    } else if (user.deviceId !== deviceId) {
      return res.status(403).json({ message: 'Device mismatch' });
    }

    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, role: user.role, user: user.toObject() });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

// Admin Login (FIXED HASH)
app.post('/api/login/admin', async (req, res) => {
    const { email, password, pin } = req.body;
    const ADMIN_EMAIL = 'infinitywaveclash@gmail.com';
    const ADMIN_PASSWORD_HASH = '$2b$10$PUPdz6SY53.tmqsicm1MTeV1Le3mHGr6LjLat.t2AkkY0xATqMn3i'; 
    // 👉 CLEAN HASH
    const ADMIN_PIN_HASH = '$2b$10$27M4KnZErZmhfF3Pg9DXZ.eeeJIrzcaZ5H9xOlnVYc.NIqBVtESd6';

    if (email === ADMIN_EMAIL && await bcrypt.compare(password, ADMIN_PASSWORD_HASH) && await bcrypt.compare(pin, ADMIN_PIN_HASH)) {
        const token = jwt.sign({ userId: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
        return res.json({ success: true, role: 'admin', token });
    }
    res.status(401).json({ error: 'Invalid Admin Credentials' });
});

/* =========================
   EPS TO JPG & ADMIN ROUTES
========================= */
app.post('/api/convert-eps', usageLimitMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const outputPath = req.file.path + ".jpg";
  exec(`magick -density 300 eps:"${req.file.path}" -quality 90 "${outputPath}"`, async (err) => {
    if(err) return res.status(500).json({ error: 'Conversion failed' });
    await User.findByIdAndUpdate(req.user._id, { $inc: { usageCount: 1 } });
    res.json({ fileUrl: req.file.path, previewUrl: outputPath });
  });
});

app.get('/api/admin/users', verifyAdmin, async (req, res) => res.json(await User.find({})));

app.put('/api/admin/users/:id/approve', verifyAdmin, async (req, res) => {
  const { plan, accessStart, accessEnd } = req.body;
  await User.findByIdAndUpdate(req.params.id, { 
    status: 'active', planName: plan, accessStart: new Date(accessStart), accessEnd: new Date(accessEnd), usageCount: 0 
  });
  res.json({ success: true });
});

app.delete('/api/admin/users/:id/delete', verifyAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id); res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT} 🚀`));