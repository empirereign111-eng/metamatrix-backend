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
app.use('/uploads', express.static('uploads')); // serve static uploads

/* =========================
   DB CONNECT & MODELS
========================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected ✅'))
  .catch(err => console.error('MongoDB error ❌', err.message));

// User Model need to align with frontend expectations
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
// Avoid OverwriteModelError
const User = mongoose.models.User || mongoose.model('User', userSchema);

const generationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  model: String,
  createdAt: { type: Date, default: Date.now }
});
const GenerationLog = mongoose.models.GenerationLog || mongoose.model('GenerationLog', generationLogSchema);

/* =========================
   EMAIL SETUP (With App Icon & Dark Theme)
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
  const subject = isReset ? 'Reset your MetaMatrix password' : `${code} is your verification code`;
  
  // Icon Attachment
  const iconPath = path.join(__dirname, 'icon.ico');
  const attachments = [];
  if (fs.existsSync(iconPath)) {
    attachments.push({ filename: 'logo.png', path: iconPath, cid: 'applogo' });
  }

  const mailOptions = {
    // Hiding raw email
    from: `"MetaMatrix Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    attachments: attachments,
    html: `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #1A0B2E; padding: 30px; text-align: center;">
            ${attachments.length ? '<img src="cid:applogo" style="width: 50px; height: 50px; border-radius: 10px; margin-bottom: 5px;">' : ''}
            <h1 style="color: #22D3EE; margin: 0; letter-spacing: 2px;">MetaMatrix</h1>
        </div>
        <div style="padding: 40px 30px; color: #333333;">
            <p>Hi <strong>${name || 'there'}</strong>,</p>
            <p>${isReset ? 'We received a request to reset your password. Please use the following code:' : 'To secure your account, please use this verification code:'}</p>
            <div style="text-align: center; margin: 35px 0;">
                <div style="display: inline-block; padding: 15px 30px; background-color: #F3F4F6; border: 2px dashed #8B5CF6; border-radius: 8px;">
                    <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1A0B2E;">${code}</span>
                </div>
            </div>
            <p style="font-size: 14px; color: #666666;">This code is valid for 10 minutes.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            © 2026 MetaMatrix Systems. All rights reserved.
        </div>
    </div>`
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

  if (user.limitType === 'daily') {
    if (resetTime.getDate() !== now.getDate() || 
        resetTime.getMonth() !== now.getMonth() || 
        resetTime.getFullYear() !== now.getFullYear()) {
      shouldReset = true;
    }
  } else if (user.limitType === 'monthly') {
    if (resetTime.getMonth() !== now.getMonth() || 
        resetTime.getFullYear() !== now.getFullYear()) {
      shouldReset = true;
    }
  }

  if (shouldReset) {
    const updated = await User.findOneAndUpdate(
      { _id: user._id, lastUsageReset: user.lastUsageReset },
      { $set: { usageCount: 0, dailyUsageCount: 0, lastUsageReset: now } },
      { new: true }
    );
    return updated || user;
  }
  return user;
};

/* =========================
   SOCKET.IO (Real-time tracking)
========================= */
const activeSockets = new Map();
const runningBatches = new Map();

io.on('connection', (socket) => {
  socket.on('join-admin', (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role === 'admin') {
        socket.join('admin-room');
        socket.emit('admin:sync', {
          activeUsers: Array.from(activeSockets.entries()),
          runningBatches: Array.from(runningBatches.entries())
        });
      }
    } catch (err) { socket.disconnect(); }
  });

  socket.on('user:online', (data) => {
    try {
      const decoded = jwt.verify(data.token, JWT_SECRET);
      activeSockets.set(socket.id, { userId: decoded.userId, email: decoded.email, connectedAt: Date.now() });
      io.to('admin-room').emit('user:join', { socketId: socket.id, userId: decoded.userId, email: decoded.email });
    } catch(err) {}
  });

  socket.on('batch:started', (data) => {
    runningBatches.set(socket.id, data);
    io.to('admin-room').emit('batch:started', { socketId: socket.id, ...data });
  });

  socket.on('batch:progress', (data) => {
    if(runningBatches.has(socket.id)) {
      runningBatches.set(socket.id, { ...runningBatches.get(socket.id), ...data });
    }
    io.to('admin-room').emit('batch:progress', { socketId: socket.id, ...data });
  });

  socket.on('batch:completed', (data) => {
    runningBatches.delete(socket.id);
    io.to('admin-room').emit('batch:completed', { socketId: socket.id, ...data });
  });

  socket.on('batch:stopped', (data) => {
    runningBatches.delete(socket.id);
    io.to('admin-room').emit('batch:stopped', { socketId: socket.id });
  });

  socket.on('batch:failed', (data) => {
    runningBatches.delete(socket.id);
    io.to('admin-room').emit('batch:failed', { socketId: socket.id, error: data.error });
  });

  socket.on('admin:force-logout', (targetSocketId) => io.to(targetSocketId).emit('force-logout'));
  socket.on('admin:stop-batch', (targetSocketId) => io.to(targetSocketId).emit('stop-batch'));

  socket.on('disconnect', () => {
    if (activeSockets.has(socket.id)) {
      const user = activeSockets.get(socket.id);
      activeSockets.delete(socket.id);
      io.to('admin-room').emit('user:offline', { socketId: socket.id, userId: user?.userId });
    }
    if (runningBatches.has(socket.id)) {
      runningBatches.delete(socket.id);
      io.to('admin-room').emit('batch:stopped', { socketId: socket.id });
    }
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

const rateLimiter = new Map();
const checkRateLimit = (userId) => {
  const now = Date.now();
  let timestamps = rateLimiter.get(userId) || [];
  timestamps = timestamps.filter(t => now - t < 1000);
  if (timestamps.length >= 5) return false;
  timestamps.push(now);
  rateLimiter.set(userId, timestamps);
  return true;
};

const usageLimitMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch(err) { return res.status(401).json({ error: 'Invalid token' }); }

    if (!checkRateLimit(decoded.userId)) return res.status(429).json({ message: 'Too many requests' });

    let user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user = await checkAndResetUserUsage(user);

    const now = new Date();
    if (user.accessEnd && now.getTime() > new Date(user.accessEnd).getTime()) {
      return res.status(403).json({ message: 'Request denied' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Request denied' });
    }
    if (user.maxLimit !== -1 && user.usageCount >= user.maxLimit) {
      return res.status(403).json({ success: false, message: 'Request denied' });
    }

    req.user = user;
    next();
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
};

/* =========================
   AUTH & VERIFICATION ROUTES (🔥 FIXED LOGIC HERE)
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
      name, email: cleanEmail, password: hashedPassword, isVerified: false,
      verificationCode: code, verificationExpires: new Date(Date.now() + 10 * 60 * 1000)
    });
    await user.save();

    await sendEmail(cleanEmail, code, 'verify', name);
    res.status(201).json({ message: 'Registration successful', status: 'unverified' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// 👉 ROBUST VERIFY LOGIC (Catching otp, code, verificationCode & Multiple Routes)
const verifyLogic = async (req, res) => {
    try {
        const { email, otp, code, verificationCode } = req.body;
        const targetCode = (otp || code || verificationCode)?.toString().trim();
        
        if (!email || !targetCode) return res.status(400).json({ error: 'Email and OTP are required' });

        const user = await User.findOne({ 
            email: email.toLowerCase().trim(), 
            verificationCode: targetCode 
        });

        if (!user) return res.status(400).json({ error: 'Invalid verification code' });
        if (user.verificationExpires && user.verificationExpires < Date.now()) return res.status(400).json({ error: 'Code expired' });

        user.isVerified = true;
        user.verificationCode = null;
        user.verificationExpires = null;
        await user.save();

        res.json({ message: 'Email verified successfully.' });
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
};

app.post('/api/verify-otp', verifyLogic);
app.post('/api/verify-email', verifyLogic);
app.post('/api/verify-code', verifyLogic);
app.post('/api/auth/verify', verifyLogic);

// 👉 ROBUST RESEND LOGIC (Multiple Routes)
const resendLogic = async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required' });
      
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (user.isVerified) return res.status(400).json({ error: 'Already verified' });
      
      const code = generateCode();
      user.verificationCode = code; 
      user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      
      await sendEmail(email, code, 'verify', user.name);
      res.json({ message: 'Code resent' });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
};

app.post('/api/resend-otp', resendLogic);
app.post('/api/resend-verification', resendLogic);
app.post('/api/auth/resend-otp', resendLogic);
app.post('/api/verify-resend', resendLogic);

/* =========================
   PASSWORD RESET
========================= */
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ error: 'No account found' });
    const resetCode = generateCode();
    user.resetPasswordCode = resetCode; user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendEmail(email, resetCode, 'reset', user.name);
    res.json({ message: 'Reset code sent' });
  } catch(err) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim(), resetPasswordCode: code, resetPasswordExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset code' });
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordCode = null; user.resetPasswordExpires = null;
    await user.save();
    res.json({ message: 'Password reset successfully' });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

/* =========================
   USER LOGIN
========================= */
app.post('/api/login/user', async (req, res) => {
  const { email, password, deviceId } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Support both plaintext and bcrypt hashes if applicable
    let isMatch = false;
    try { isMatch = await bcrypt.compare(password, user.password); } 
    catch(err) { isMatch = user.password === password; }

    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isVerified) return res.status(403).json({ success: false, status: 'unverified' });
    if (['pending', 'pending_request'].includes(user.status)) return res.status(200).json({ success: false, status: 'pending' });
    if (user.status === 'blocked') return res.status(403).json({ message: 'Account blocked' });

    if (!user.deviceId) {
      user.deviceId = deviceId; await user.save();
    } else if (user.deviceId !== deviceId) {
      return res.status(403).json({ message: 'This account is already used on another device' });
    }

    const now = new Date();
    if (user.accessEnd && now > user.accessEnd) {
      if (user.status !== 'expired') await User.findByIdAndUpdate(user._id, { status: 'expired' });
      return res.status(403).json({ message: 'Plan expired' });
    }

    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.status(200).json({ token, role: user.role, user: user.toObject() });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

/* =========================
   ADMIN LOGIN (🔥 PIN HASH FIXED)
========================= */
const loginAttempts = new Map();
app.post('/api/login/admin', async (req, res) => {
  const { email, password, pin } = req.body;
  let ip = req.ip || 'unknown';
  if (ip.startsWith('::ffff:')) ip = ip.substring(7);

  const attempt = loginAttempts.get(ip);
  if (attempt && attempt.lockUntil > Date.now()) return res.status(429).json({ error: "Too many attempts" });

  const recordFailed = () => {
    const att = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };
    att.count++;
    if (att.count >= 3) att.lockUntil = Date.now() + 30000;
    loginAttempts.set(ip, att);
  };

  const ADMIN_EMAIL = 'infinitywaveclash@gmail.com';
  const ADMIN_PASSWORD_HASH = '$2b$10$PUPdz6SY53.tmqsicm1MTeV1Le3mHGr6LjLat.t2AkkY0xATqMn3i'; 
  // 👉 Fixed Hash
  const ADMIN_PIN_HASH = '$2b$10$27M4KnZErZmhfF3Pg9DXZ.eeeJIrzcaZ5H9xOlnVYc.NIqBVtESd6';

  if (email !== ADMIN_EMAIL) { recordFailed(); return res.status(401).json({ error: 'Invalid' }); }
  if (!(await bcrypt.compare(password, ADMIN_PASSWORD_HASH))) { recordFailed(); return res.status(401).json({ error: 'Invalid' }); }
  if (!(await bcrypt.compare(pin, ADMIN_PIN_HASH))) { recordFailed(); return res.status(401).json({ error: 'Invalid PIN' }); }

  loginAttempts.delete(ip);
  const token = jwt.sign({ userId: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ success: true, role: 'admin', token });
});

/* =========================
   USER VERIFICATION ROUTES
========================= */
app.get('/api/verify-token', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).json({ status: 'blocked' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'admin') return res.json({ status: 'admin', valid: true, user: { role: 'admin' } });

    let user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ status: 'blocked' });
    user = await checkAndResetUserUsage(user);

    if (user.status === 'pending') return res.status(403).json({ status: 'pending' });
    const now = new Date();
    if (user.accessEnd && now > user.accessEnd && user.status !== 'expired') {
      await User.findByIdAndUpdate(user._id, { status: 'expired' });
      return res.status(403).json({ status: 'expired' });
    } else if (user.status === 'expired') {
      return res.status(403).json({ status: 'expired' });
    }
    res.json({ status: 'active', valid: true, user: user.toObject() });
  } catch(err) { res.status(401).json({ status: 'blocked' }); }
});

/* =========================
   WORKSPACE USAGE
========================= */
app.post('/api/usage/check', usageLimitMiddleware, (req, res) => res.json({ allowed: true }));

app.post('/api/usage/increment', usageLimitMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const filter = { _id: user._id, status: "active" };
    if (user.accessEnd) filter.accessEnd = { $gt: new Date() };
    if (user.maxLimit !== -1) filter.usageCount = { $lt: user.maxLimit };

    const updated = await User.findOneAndUpdate(
      filter,
      { $inc: { usageCount: 1, dailyUsageCount: 1 }, $set: { lastUsageDate: new Date() } },
      { new: true }
    );
    if (!updated) return res.status(403).json({ message: "Request denied" });
    res.json({ success: true, usageCount: updated.usageCount });
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/request-plan', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    await User.findByIdAndUpdate(decoded.userId, { status: 'pending_request', requestedPlan: req.body.planName });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: 'error' }); }
});

/* =========================
   EPS TO JPG CONVERTER
========================= */
app.post('/api/convert-eps', usageLimitMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const outputPath = req.file.path + ".jpg";
  exec(`magick -density 300 eps:"${req.file.path}" -quality 90 "${outputPath}"`, async (error) => {
    if(error) return res.status(500).json({ error: 'Conversion failed' });

    const updated = await User.findOneAndUpdate(
      { _id: req.user._id, status: 'active', ...(req.user.accessEnd && { accessEnd: { $gt: new Date() } }), ...(req.user.maxLimit !== -1 && { usageCount: { $lt: req.user.maxLimit } }) },
      { $inc: { usageCount: 1, dailyUsageCount: 1 }, $set: { lastUsageDate: new Date() } },
      { new: true }
    );
    if(!updated) return res.status(403).json({ message: 'Request denied' });
    res.json({ fileUrl: req.file.path, previewUrl: outputPath });
  });
});

/* =========================
   ADMIN PANEL ROUTES
========================= */
app.get('/api/admin/analytics/summary', verifyAdmin, async (req, res) => {
  const totalUsers = await User.countDocuments({});
  const activeUsers = await User.countDocuments({ lastUsageDate: { $gte: new Date().setHours(0,0,0,0) } });
  const totalFiles = (await User.aggregate([{$group: {_id: null, total: {$sum: '$usageCount'}}}]))[0]?.total || 0;
  res.json({ totalUsers, activeUsers, totalFiles });
});
app.get('/api/admin/analytics/top-users', verifyAdmin, async (req, res) => {
  res.json(await User.find({}).sort({ usageCount: -1 }).limit(5).select('name email usageCount status'));
});
app.get('/api/admin/analytics/model-usage', verifyAdmin, async (req, res) => {
  res.json(await GenerationLog.aggregate([{$group: {_id: '$model', count: {$sum: 1}}}]));
});
app.get('/api/admin/users', verifyAdmin, async (req, res) => res.json(await User.find({})));
app.get('/api/admin/user/:id/details', verifyAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json({
    usage: { today: user.dailyUsageCount, total: user.usageCount, max: user.maxLimit, limitType: user.limitType },
    subscription: { plan: user.planName, start: user.accessStart, end: user.accessEnd, status: user.status },
    activity: { lastUsageDate: user.lastUsageDate }
  });
});

app.put('/api/admin/users/:id/approve', verifyAdmin, async (req, res) => {
  const { plan, accessStart, accessEnd } = req.body;
  await User.findByIdAndUpdate(req.params.id, { status: 'active', planName: plan, accessStart: new Date(accessStart), accessEnd: new Date(accessEnd), requestedPlan: null });
  res.json({ success: true });
});
app.put('/api/admin/users/:id/reject-plan', verifyAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  await User.findByIdAndUpdate(req.params.id, { status: user.planName ? 'active' : 'pending', requestedPlan: null });
  res.json({ success: true });
});
app.put('/api/admin/users/:id/plan', verifyAdmin, async (req, res) => {
  const { planName, accessStart, accessEnd, maxLimit, limitType } = req.body;
  const update = { planName, accessStart, accessEnd };
  if(maxLimit !== undefined) update.maxLimit = maxLimit; if(limitType !== undefined) update.limitType = limitType;
  await User.findByIdAndUpdate(req.params.id, update);
  res.json({ success: true });
});
app.put('/api/admin/users/:id/extend', verifyAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  const currentEnd = user.accessEnd && new Date(user.accessEnd) > new Date() ? new Date(user.accessEnd) : new Date();
  currentEnd.setDate(currentEnd.getDate() + parseInt(req.body.days));
  await User.findByIdAndUpdate(req.params.id, { accessEnd: currentEnd, status: 'active' });
  res.json({ success: true });
});
app.put('/api/admin/users/:id/block', verifyAdmin, async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { status: 'blocked' }); res.json({ success: true });
});
app.put('/api/admin/users/:id/reset-device', verifyAdmin, async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { deviceId: null }); res.json({ success: true });
});
app.put('/api/admin/users/:id/reset-usage', verifyAdmin, async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { usageCount: 0, dailyUsageCount: 0 }); res.json({ success: true });
});
app.delete('/api/admin/users/:id/delete', verifyAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id); res.json({ success: true });
});

// Start Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT} 🚀`));