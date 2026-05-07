import express from 'express';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import path from 'path';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import bcrypt from 'bcrypt';
import http from 'http';
import { Server } from 'socket.io';
import nodemailer from 'nodemailer';

export let io: Server;

// Real-time tracking Data
const activeSockets = new Map<string, { userId: string, email: string, connectedAt: number }>();
const runningBatches = new Map<string, any>();

// Simple in-memory brute force protection
const loginAttempts = new Map<string, { count: number, lockUntil: number }>();
import { exec } from 'child_process';

const upload = multer({ dest: 'uploads/' });

const JWT_SECRET = process.env.JWT_SECRET || 'MetaMatrix@Secure#2026!#X9pL2@Z';

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI;
    
    if (!uri) {
      throw new Error('MONGO_URI environment variable is required for persistence.');
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB successfully');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
}

connectDB();

// ==========================================
// 1. USER MODEL (MongoDB / Mongoose)
// ==========================================
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
  // Verification fields
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String, default: null },
  verificationExpires: { type: Date, default: null },
  // Password Reset fields
  resetPasswordCode: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
});
const User = mongoose.model('User', userSchema);

const generationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  model: String,
  createdAt: { type: Date, default: Date.now }
});
const GenerationLog = mongoose.model('GenerationLog', generationLogSchema);

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  io = new Server(httpServer, {
    cors: { origin: '*' }
  });
  
  const PORT = 3000;

  app.use(express.json());

  // Email Configuration
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const sendVerificationEmail = async (email: string, code: string) => {
    const mailOptions = {
      from: `"MetaMatrix" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your MetaMatrix account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Welcome to MetaMatrix</h2>
          <p>Thank you for registering. Please use the following code to verify your account:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937; border-radius: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">&copy; 2026 MetaMatrix. All rights reserved.</p>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
  };

  const sendResetEmail = async (email: string, code: string) => {
    const mailOptions = {
      from: `"MetaMatrix" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset your MetaMatrix password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Password Reset Request</h2>
          <p>We received a request to reset your password. Please use the following code to reset it:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937; border-radius: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">&copy; 2026 MetaMatrix. All rights reserved.</p>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
  };

  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  // Admin Analytics
  app.get('/api/admin/analytics/summary', verifyAdmin, async (req, res) => {
    try {
      const totalUsers = await User.countDocuments({});
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeUsers = await User.countDocuments({ lastUsageDate: { $gte: today } });
      const totalFiles = (await User.aggregate([{$group: {_id: null, total: {$sum: '$usageCount'}}}]))[0]?.total || 0;
      
      res.json({ totalUsers, activeUsers, totalFiles });
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.get('/api/admin/analytics/top-users', verifyAdmin, async (req, res) => {
    try {
      const topUsers = await User.find({}).sort({ usageCount: -1 }).limit(5).select('name email usageCount status');
      res.json(topUsers);
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.get('/api/admin/analytics/model-usage', verifyAdmin, async (req, res) => {
    try {
      const modelUsage = await GenerationLog.aggregate([
        {$group: {_id: '$model', count: {$sum: 1}}}
      ]);
      res.json(modelUsage);
    } catch (e) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Socket.IO Logic
  io.on('connection', (socket) => {
    // Admin setup
    socket.on('join-admin', (token) => {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded.role === 'admin' || decoded.role === 'superadmin') {
          socket.join('admin-room');
          // Send current state
          socket.emit('admin:sync', {
            activeUsers: Array.from(activeSockets.entries()),
            runningBatches: Array.from(runningBatches.entries())
          });
        } else {
          socket.disconnect();
        }
      } catch (err) {
        socket.disconnect();
      }
    });
    
    // User logic
    socket.on('user:online', (data: { token: string }) => {
      try {
        const decoded: any = jwt.verify(data.token, JWT_SECRET);
        activeSockets.set(socket.id, {
          userId: decoded.userId,
          email: decoded.email,
          connectedAt: Date.now()
        });
        io.to('admin-room').emit('user:join', { socketId: socket.id, userId: decoded.userId, email: decoded.email });
      } catch(err) {
        // invalid token
      }
    });

    socket.on('batch:started', (data) => {
      runningBatches.set(socket.id, data);
      io.to('admin-room').emit('batch:started', { socketId: socket.id, ...data });
    });

    socket.on('batch:progress', (data) => {
      if(runningBatches.has(socket.id)) {
         const batch = runningBatches.get(socket.id);
         runningBatches.set(socket.id, { ...batch, ...data });
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

    // Admin commands
    socket.on('admin:force-logout', (targetSocketId) => {
      io.to(targetSocketId).emit('force-logout');
    });

    socket.on('admin:stop-batch', (targetSocketId) => {
      io.to(targetSocketId).emit('stop-batch');
    });

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

  // Logging middleware to identify 403 Forbidden responses
  app.use((req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode === 403) {
        console.log('403 Forbidden on:', req.path);
      }
    });
    next();
  });

  // API routes
  
  // Registration
  app.post("/api/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
    
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const verificationCode = generateCode();
      const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({ 
        name, 
        email, 
        password: hashedPassword,
        isVerified: false,
        verificationCode,
        verificationExpires
      });
      await newUser.save();

      try {
        await sendVerificationEmail(email, verificationCode);
        res.status(201).json({ 
          message: 'Registration successful. Please check your email for the verification code.',
          status: 'unverified'
        });
      } catch (emailErr) {
        console.error('Failed to send verification email:', emailErr);
        // We still created the user, they can request a resend
        res.status(201).json({ 
          message: 'Registration successful, but failed to send verification email. Please try resending the code.',
          status: 'unverified'
        });
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Verify Email
  app.post("/api/verify-email", async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

    try {
      const user = await User.findOne({ 
        email,
        verificationCode: code,
        verificationExpires: { $gt: new Date() }
      });

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
      }

      user.isVerified = true;
      user.verificationCode = null;
      user.verificationExpires = null;
      await user.save();

      res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
    } catch (err) {
      console.error('Verification error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Resend Verification Code
  app.post("/api/resend-verification", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (user.isVerified) return res.status(400).json({ error: 'Email is already verified' });

      const verificationCode = generateCode();
      const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.verificationCode = verificationCode;
      user.verificationExpires = verificationExpires;
      await user.save();

      await sendVerificationEmail(email, verificationCode);
      res.status(200).json({ message: 'Verification code resent successfully' });
    } catch (err) {
      console.error('Resend error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Forgot Password
  app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
      const user = await User.findOne({ email });
      // Minor security: Don't reveal if user exists, but the user requested clear error handling in requirements
      // for this specific flow. We'll follow the "reveal if exists" for better UX as requested.
      if (!user) return res.status(404).json({ error: 'No account found with this email' });

      const resetCode = generateCode();
      const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.resetPasswordCode = resetCode;
      user.resetPasswordExpires = resetExpires;
      await user.save();

      await sendResetEmail(email, resetCode);
      res.status(200).json({ message: 'Password reset code sent to your email' });
    } catch (err) {
      console.error('Forgot password error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Reset Password
  app.post("/api/reset-password", async (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    try {
      const user = await User.findOne({ 
        email,
        resetPasswordCode: code,
        resetPasswordExpires: { $gt: new Date() }
      });

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset code' });
      }

      // Update password (existing logic uses plain text in login but requirements specify bcrypt for new password)
      // Actually, looking at the login logic:
      // if (!user || user.password !== password) { ... }
      // The app currently uses plain text passwords. I should stick to plain text to not break login,
      // OR update login to use bcrypt.
      // THE REQUIREMENT RE-STATED: "Use bcrypt for the new password"
      // Wait, if I use bcrypt here, the existing login will fail because it does: user.password !== password
      
      // I must update the login logic to use bcrypt as well if I change it here.
      // Let's check how many users are there. It's a dev app.
      
      user.password = await bcrypt.hash(newPassword, 10);
      user.resetPasswordCode = null;
      user.resetPasswordExpires = null;
      await user.save();

      res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // User Login
  app.post("/api/login/user", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check password (handle both hashed and plain text for migration)
      let isMatch = false;
      try {
        isMatch = await bcrypt.compare(password, user.password);
      } catch (err) {
        // If it's not a hash, it will throw an error or return false.
        // Fallback to plain text check for legacy users
        isMatch = user.password === password;
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (!user.isVerified) {
        return res.status(403).json({ 
          success: false, 
          status: 'unverified', 
          message: 'Please verify your email before logging in.' 
        });
      }

      if (user.status === 'pending' || user.status === 'pending_request') {
        return res.status(200).json({ success: false, status: 'pending', message: 'Waiting for approval' });
      }

      if (user.status === 'blocked') {
        return res.status(403).json({ message: 'Account blocked' });
      }

      const { deviceId } = req.body;
      if (!user.deviceId) {
        user.deviceId = deviceId;
        await user.save();
      } else if (user.deviceId !== deviceId) {
        return res.status(403).json({ message: 'This account is already used on another device' });
      }
      
      const now = new Date();
      if (user.accessEnd && now > user.accessEnd) {
        // Automatically set status to expired if we detect it here
        if (user.status !== 'expired') {
            await User.findByIdAndUpdate(user._id, { status: 'expired' });
        }
        return res.status(403).json({ message: 'Plan expired' });
      }

      const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

      res.status(200).json({ 
        token, 
        role: user.role,
        user: { 
            id: user._id, 
            email: user.email, 
            planName: user.planName, 
            status: user.status,
            accessStart: user.accessStart,
            accessEnd: user.accessEnd,
            usageCount: user.usageCount,
            maxLimit: user.maxLimit,
            limitType: user.limitType
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admin Login
  app.post("/api/login/admin", async (req, res) => {
    const { email, password, pin } = req.body;
    let ip = req.ip || req.connection?.remoteAddress || 'unknown';
    // Clean up IP if it's an IPv6 mapped IPv4
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }
    
    // Check brute-force map
    const attempt = loginAttempts.get(ip);
    if (attempt && attempt.lockUntil > Date.now()) {
      return res.status(429).json({ error: "Too many attempts. Try later." });
    }

    // Hardcoded hashes to prevent stale environment variables from overriding the user's correct credentials.
    const ADMIN_EMAIL = 'infinitywaveclash@gmail.com';
    const ADMIN_PASSWORD_HASH = '$2b$10$PUPdz6SY53.tmqsicm1MTeV1Le3mHGr6LjLat.t2AkkY0xATqMn3i'; 
    const ADMIN_PIN_HASH = '$2b$10$27M4KnZErZmhfF3Pg9DXZ.eeeJIrzcaZ5H9xOlnVYc.NIqBVtESd6';

    const recordFailedAttempt = () => {
      const att = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };
      att.count++;
      if (att.count >= 3) {
        att.lockUntil = Date.now() + 30000; // 30 seconds
      }
      loginAttempts.set(ip, att);
    };

    if (!email || !password || !pin) {
      recordFailedAttempt();
      return res.status(401).json({ error: 'Missing credentials' });
    }

    if (email !== ADMIN_EMAIL) {
      recordFailedAttempt();
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isPasswordMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!isPasswordMatch) {
      recordFailedAttempt();
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isPinMatch = await bcrypt.compare(pin, ADMIN_PIN_HASH);
    if (!isPinMatch) {
      recordFailedAttempt();
      return res.status(401).json({ error: 'Invalid admin PIN' });
    }

    // Clear failed attempts on success
    loginAttempts.delete(ip);

    const token = jwt.sign({ userId: 'admin', role: 'admin' }, process.env.JWT_SECRET || JWT_SECRET, { expiresIn: '2h' });
    return res.status(200).json({
      success: true,
      role: 'admin',
      message: 'Admin override successful',
      token
    });
  });

  // Verify Access (Middleware / Endpoint)
  app.get('/api/verify-token', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'blocked', error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      if (decoded.role === 'admin') {
        return res.json({ status: 'admin', valid: true, user: { role: 'admin' } });
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ status: 'blocked', error: 'User not found' });
      }

      if (user.status === 'pending') {
        return res.status(403).json({ status: 'pending', error: 'Waiting for approval' });
      }

      const now = new Date();
      if (user.accessEnd && now > user.accessEnd && (user.status as string) !== 'expired') {
        await User.findByIdAndUpdate(user._id, { status: 'expired' });
        return res.status(403).json({ status: 'expired', error: 'Access expired' });
      } else if ((user.status as string) === 'expired') {
        return res.status(403).json({ status: 'expired', error: 'Access expired' });
      }

      res.json({ 
        status: 'active', 
        valid: true, 
        user: { 
            id: user._id, 
            email: user.email,
            role: user.role, 
            status: user.status,
            planName: user.planName,
            accessStart: user.accessStart,
            accessEnd: user.accessEnd,
            usageCount: user.usageCount,
            maxLimit: user.maxLimit,
            limitType: user.limitType
        } 
      });
    } catch (err) {
      return res.status(401).json({ status: 'blocked', error: 'Invalid or expired token' });
    }
  });

  app.get('/api/verify-access', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'blocked', error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      if (decoded.role === 'admin') {
        return res.json({ status: 'admin', valid: true });
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ status: 'blocked', error: 'User not found' });
      }

      if (user.status === 'pending') {
        return res.status(403).json({ status: 'pending', error: 'Waiting for approval' });
      }

      if (user.status === 'pending_request') {
        // Just let them use their current plan while waiting, or block them?
        // Let's block them as pending out of caution, or let them in if they had access before.
        // The prompt says "Save as: status = pending_request". If they are upgrading,
        // it implies they might not have access to new features yet.
        // We'll treat them as 'pending_request' but let them in with their OLD plan!
        // To do this, we just don't return 403 here, we let it pass.
      } else if (user.status !== 'active') {
        return res.status(403).json({ status: 'blocked', error: 'Account disabled' });
      }

      const now = new Date();
      if (user.accessEnd && now > user.accessEnd && (user.status as string) !== 'expired') {
        await User.findByIdAndUpdate(user._id, { status: 'expired' });
        return res.status(403).json({ status: 'expired', error: 'Access expired' });
      } else if ((user.status as string) === 'expired') {
        return res.status(403).json({ status: 'expired', error: 'Access expired' });
      }

      res.json({ 
        status: 'active', 
        valid: true, 
        user: { 
            id: user._id, 
            role: user.role, 
            planName: user.planName,
            accessStart: user.accessStart,
            accessEnd: user.accessEnd,
            usageCount: user.usageCount,
            maxLimit: user.maxLimit,
            limitType: user.limitType
        } 
      });
    } catch (err) {
      return res.status(401).json({ status: 'blocked', error: 'Invalid or expired token' });
    }
  });

  // Dummy middleware for route protection
  function verifyAdmin(req: any, res: any, next: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };

  // View all users
  app.get('/api/admin/users', verifyAdmin, async (req, res) => {
    try {
      const users = await User.find({});
      res.json(users);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Approve user with specific plan and dates
  app.put('/api/admin/users/:id/approve', verifyAdmin, async (req, res) => {
    try {
      const { plan, accessStart, accessEnd } = req.body;
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      user.status = 'active';
      user.planName = plan;
      user.accessStart = new Date(accessStart);
      user.accessEnd = new Date(accessEnd);
      user.requestedPlan = null;
      
      await user.save();
      console.log("User approved:", user._id);
      res.json({ success: true, message: 'User approved' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to approve user' });
    }
  });

  // Reject plan request
  app.put('/api/admin/users/:id/reject-plan', verifyAdmin, async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      const prevStatus = user.planName ? 'active' : 'pending'; // revert logic
      await User.findByIdAndUpdate(req.params.id, { status: prevStatus, requestedPlan: null });
      res.json({ success: true, message: 'Plan request rejected' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to reject plan' });
    }
  });

  // Reset device
  app.put('/api/admin/users/:id/reset-device', verifyAdmin, async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      user.deviceId = null;
      await user.save();
      res.json({ success: true, message: 'Device ID reset' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to reset device' });
    }
  });

  // Block user
  app.put('/api/admin/users/:id/block', verifyAdmin, async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      user.status = 'blocked';
      await user.save();
      res.json({ success: true, message: 'User blocked' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to block user' });
    }
  });

  // Reset user usage
  app.put('/api/admin/users/:id/reset-usage', verifyAdmin, async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.params.id, { usageCount: 0, dailyUsageCount: 0, lastUsageReset: new Date() });
      res.json({ success: true, message: 'Usage reset' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to reset usage' });
    }
  });

  // Get User Details
  app.get('/api/admin/user/:id/details', verifyAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      // Find current batch for this user
      let currentBatch = null;
      for (const [socketId, socketInfo] of activeSockets.entries()) {
        if (socketInfo.userId === userId && runningBatches.has(socketId)) {
          currentBatch = runningBatches.get(socketId);
          break;
        }
      }
      
      res.json({
        usage: {
          today: user.dailyUsageCount,
          total: user.usageCount,
          max: user.maxLimit,
          remaining: user.maxLimit !== -1 ? Math.max(0, user.maxLimit - user.dailyUsageCount) : Infinity,
          limitType: user.limitType
        },
        subscription: {
          plan: user.planName,
          start: user.accessStart,
          end: user.accessEnd,
          status: user.status
        },
        activity: {
          lastUsageDate: user.lastUsageDate
        },
        currentBatch
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch user details' });
    }
  });

  // Delete user
  app.delete('/api/admin/users/:id/delete', verifyAdmin, async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'User deleted' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Assign plan & set access duration & limits
  app.put('/api/admin/users/:id/plan', verifyAdmin, async (req, res) => {
    try {
      const { planName, accessStart, accessEnd, maxLimit, limitType } = req.body;
      const update: any = { planName, accessStart, accessEnd };
      if (maxLimit !== undefined) update.maxLimit = maxLimit;
      if (limitType !== undefined) update.limitType = limitType;
      
      await User.findByIdAndUpdate(req.params.id, update);
      res.json({ success: true, message: 'Plan and limits updated' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update plan' });
    }
  });

  // Extend plan
  app.put('/api/admin/users/:id/extend', verifyAdmin, async (req, res) => {
    try {
      const { days } = req.body;
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      const currentEnd = user.accessEnd ? new Date(user.accessEnd) : new Date();
      if (currentEnd < new Date()) currentEnd.setTime(Date.now()); // Start from now if expired
      currentEnd.setDate(currentEnd.getDate() + parseInt(days));
      
      user.accessEnd = currentEnd;
      user.status = 'active';
      await user.save();
      res.json({ success: true, message: 'Plan extended' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to extend plan' });
    }
  });

  app.post('/api/request-plan', async (req: any, res: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      const { planName } = req.body;
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.status = 'pending_request';
      user.requestedPlan = planName;
      await user.save();

      res.json({ success: true, message: 'Request sent for approval' });
    } catch (e: any) {
      if (e.name === 'TokenExpiredError' || e.name === 'JsonWebTokenError') {
         return res.status(401).json({ error: 'Invalid or expired token' });
      }
      res.status(500).json({ error: 'Failed to request plan' });
    }
  });

  const rateLimiter = new Map<string, number[]>();
  const activeUsers = new Set<string>();

  const checkRateLimit = (userId: string) => {
    const now = Date.now();
    const window = 1000;

    let timestamps = rateLimiter.get(userId) || [];
    timestamps = timestamps.filter(t => now - t < window);

    if (timestamps.length >= 5) return false;

    timestamps.push(now);
    rateLimiter.set(userId, timestamps);
    return true;
  };

  const usageLimitMiddleware = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
      
      let decoded: any;
      try {
        decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      
      if (!checkRateLimit(decoded.userId)) {
        console.warn(`[ABUSE] Rate limit exceeded by User: ${decoded.userId}`);
        return res.status(429).json({ message: 'Too many requests' });
      }

      const user = await User.findById(decoded.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      const now = new Date();
      let shouldReset = false;
      
      if (user.limitType === 'daily') {
        const resetTime = user.lastUsageReset ? new Date(user.lastUsageReset) : new Date(0);
        if (resetTime.getDate() !== now.getDate() || resetTime.getMonth() !== now.getMonth() || resetTime.getFullYear() !== now.getFullYear()) {
          shouldReset = true;
        }
      } else if (user.limitType === 'monthly') {
        const resetTime = user.lastUsageReset ? new Date(user.lastUsageReset) : new Date(0);
        if (resetTime.getMonth() !== now.getMonth() || resetTime.getFullYear() !== now.getFullYear()) {
          shouldReset = true;
        }
      }

      if (shouldReset) {
        await User.updateOne(
          { _id: user._id, lastUsageReset: user.lastUsageReset },
          { $set: { usageCount: 0, lastUsageReset: now } }
        );
        user.usageCount = 0;
        user.lastUsageReset = now;
      }

      const nowTime = now.getTime();
      if (user.accessEnd && nowTime > new Date(user.accessEnd).getTime()) {
        console.warn(`[ABUSE] Access expired for User: ${decoded.userId}`);
        return res.status(403).json({ message: 'Request denied' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ message: 'Request denied' });
      }

      // STRICT LIMIT CHECK
      if (user.maxLimit !== null && user.maxLimit !== -1 && user.usageCount >= user.maxLimit) {
        console.warn(`[ABUSE] Limit reached for User: ${decoded.userId} - usages: ${user.usageCount}/${user.maxLimit}`);
        return res.status(403).json({
          success: false,
          message: 'Request denied' // Hide internal details
        });
      }

      req.user = user;
      next();
    } catch (e) {
      console.error('Usage check failed', e);
      res.status(500).json({ error: 'Failed' });
    }
  };

  // Check usage and increment usage
  app.post('/api/usage/check', usageLimitMiddleware, async (req: any, res: any) => {
    try {
      res.json({ allowed: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed check' });
    }
  });




  const convertEpsToJpg = (inputPath: string) => {
    return new Promise((resolve, reject) => {
      // Ensure the output path is different and ends in .jpg
      const outputPath = inputPath + ".jpg";
      console.log("EPS input:", inputPath);
      console.log("JPG output:", outputPath);
  
      const command = `magick -density 300 eps:"${inputPath}" -quality 90 "${outputPath}"`;
  
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("Conversion error:", error);
          console.error("Conversion stderr:", stderr);
          return reject(new Error(`Conversion failed: ${stderr || error.message}`));
        }
        resolve(outputPath);
      });
    });
  };

  app.get('/api/debug-magick', (req, res) => {
    exec('magick -version', (errorMagick, stdoutMagick, stderrMagick) => {
      exec('convert -version', (errorConvert, stdoutConvert, stderrConvert) => {
        res.json({
          magick: { success: !errorMagick, version: stdoutMagick, error: stderrMagick },
          convert: { success: !errorConvert, version: stdoutConvert, error: stderrConvert }
        });
      });
    });
  });

  app.post('/api/convert-eps', usageLimitMiddleware, upload.single('file'), async (req: any, res: any) => {
    const user = req.user;
    
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    try {
      const previewPath = await convertEpsToJpg(req.file.path);
      
      // Atomic Update
      const filter_eps: any = { 
        _id: user._id, 
        status: "active"
      };

      // Add accessEnd check if defined
      if (user.accessEnd) {
        filter_eps.accessEnd = { $gt: new Date() };
      }

      if (user.maxLimit !== null && user.maxLimit !== -1) {
        filter_eps.usageCount = { $lt: user.maxLimit };
      }

      const updatedUser = await User.findOneAndUpdate(
        filter_eps,
        {
          $inc: { usageCount: 1 },
          $set: { lastUsageDate: new Date() }
        },
        { new: true }
      );

      if (!updatedUser) {
        console.warn(`[ABUSE] DB Atomic update failed (Limit/Expired) for User: ${user._id}`);
        return res.status(403).json({ message: "Request denied" });
      }

      res.json({
        fileUrl: req.file.path,
        previewUrl: previewPath
      });
    } catch (e) {
      console.error('Conversion failed:', e);
      res.status(500).json({ error: 'Conversion failed' });
    }
  });

  app.post('/api/usage/increment', usageLimitMiddleware, async (req: any, res: any) => {
    try {
      const user = req.user;

      // Atomic Update
      const filter_inc: any = { 
        _id: user._id,
        status: "active"
      };

      // Add accessEnd check if defined
      if (user.accessEnd) {
        filter_inc.accessEnd = { $gt: new Date() };
      }

      if (user.maxLimit !== null && user.maxLimit !== -1) {
        filter_inc.usageCount = { $lt: user.maxLimit };
      }

      const updatedUser = await User.findOneAndUpdate(
        filter_inc,
        {
          $inc: { usageCount: 1 },
          $set: { lastUsageDate: new Date() }
        },
        { new: true }
      );

      if (!updatedUser) {
        console.warn(`[ABUSE] DB Atomic update failed (Limit/Expired) for User: ${user._id}`);
        return res.status(403).json({ message: "Request denied" });
      }
      
      res.json({ success: true, usageCount: updatedUser.usageCount });
    } catch (e) {
      res.status(500).json({ error: 'Failed to increment' });
    }
  });

  // Fallback for unmatched /api routes to prevent HTML response
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Path not found: ${req.path}` });
  });

  // Global Error Handler for /api routes
  app.use('/api', (err: any, req: any, res: any, next: any) => {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Something went wrong on the server' });
  });

  // Global Error Handler for ALL routes
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Global Error:', err);
    if (req.path.startsWith('/api')) {
      const status = typeof err.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;
      return res.status(status).json({ error: err.message || 'Something went wrong on the server' });
    } else {
      next(err); // Let Vite/Static handle
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use('/uploads', express.static('uploads'));

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
