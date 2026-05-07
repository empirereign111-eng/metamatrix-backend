const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

/* ==========================================
   USER MODEL
========================================== */

const userSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  status: {
    type: String,
    enum: ['pending', 'active', 'blocked'],
    default: 'pending'
  },

  accessStart: {
    type: Date
  },

  accessEnd: {
    type: Date
  },

  planName: {
    type: String
  }

}, {
  timestamps: true
});

/* ==========================================
   FIX MODEL OVERWRITE
========================================== */

const User =
  mongoose.models.User ||
  mongoose.model('User', userSchema);

/* ==========================================
   JWT GENERATOR
========================================== */

function generateToken(user) {

  return jwt.sign(
    {
      id: user._id,
      role: user.role
    },

    process.env.JWT_SECRET || 'supersecretkey',

    {
      expiresIn: '7d'
    }
  );
}

/* ==========================================
   LOGIN
========================================== */

router.post('/auth/login', async (req, res) => {

  try {

    const { email, password } = req.body;

    /* ==========================================
       ADMIN OVERRIDE
    ========================================== */

    if (
      email === 'adminxaeza@metamatrix.com' &&
      password === 'mh53aeza2000'
    ) {

      const adminToken = jwt.sign(

        {
          role: 'admin',
          email
        },

        process.env.JWT_SECRET || 'supersecretkey',

        {
          expiresIn: '30d'
        }
      );

      return res.json({
        success: true,
        role: 'admin',
        message: 'Admin override successful',
        token: adminToken
      });
    }

    /* ==========================================
       NORMAL USER
    ========================================== */

    const user = await User.findOne({ email });

    if (!user) {

      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    /* ==========================================
       PASSWORD CHECK
    ========================================== */

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {

      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    /* ==========================================
       STATUS CHECK
    ========================================== */

    if (user.status !== 'active') {

      return res.status(403).json({
        error: `Login blocked. Account status: ${user.status}`
      });
    }

    /* ==========================================
       ACCESS CHECK
    ========================================== */

    const now = new Date();

    if (
      user.accessEnd &&
      now > new Date(user.accessEnd)
    ) {

      return res.status(403).json({
        error: 'Access expired. Please renew your plan.'
      });
    }

    /* ==========================================
       SUCCESS
    ========================================== */

    const token = generateToken(user);

    return res.json({

      success: true,

      role: user.role,

      user: {
        id: user._id,
        email: user.email,
        planName: user.planName,
        status: user.status
      },

      token
    });

  }

  catch (error) {

    console.error('LOGIN ERROR:', error);

    return res.status(500).json({
      error: 'Internal server error'
    });
  }

});

/* ==========================================
   VERIFY ADMIN
========================================== */

const verifyAdmin = async (req, res, next) => {

  try {

    const authHeader = req.headers.authorization;

    if (!authHeader) {

      return res.status(401).json({
        error: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'supersecretkey'
    );

    if (decoded.role !== 'admin') {

      return res.status(403).json({
        error: 'Admin access required'
      });
    }

    req.user = decoded;

    next();

  }

  catch (error) {

    return res.status(401).json({
      error: 'Invalid token'
    });
  }

};

/* ==========================================
   GET USERS
========================================== */

router.get('/admin/users', verifyAdmin, async (req, res) => {

  try {

    const users = await User.find({});

    res.json(users);

  }

  catch (error) {

    res.status(500).json({
      error: 'Failed to fetch users'
    });
  }

});

/* ==========================================
   APPROVE USER
========================================== */

router.put('/admin/users/:id/approve', verifyAdmin, async (req, res) => {

  try {

    await User.findByIdAndUpdate(

      req.params.id,

      {
        status: 'active'
      }
    );

    res.json({
      success: true,
      message: 'User approved'
    });

  }

  catch (error) {

    res.status(500).json({
      error: 'Failed to approve user'
    });
  }

});

/* ==========================================
   BLOCK USER
========================================== */

router.put('/admin/users/:id/block', verifyAdmin, async (req, res) => {

  try {

    await User.findByIdAndUpdate(

      req.params.id,

      {
        status: 'blocked'
      }
    );

    res.json({
      success: true,
      message: 'User blocked'
    });

  }

  catch (error) {

    res.status(500).json({
      error: 'Failed to block user'
    });
  }

});

/* ==========================================
   DELETE USER
========================================== */

router.delete('/admin/users/:id/delete', verifyAdmin, async (req, res) => {

  try {

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted'
    });

  }

  catch (error) {

    res.status(500).json({
      error: 'Failed to delete user'
    });
  }

});

/* ==========================================
   UPDATE PLAN
========================================== */

router.put('/admin/users/:id/plan', verifyAdmin, async (req, res) => {

  try {

    const {
      planName,
      accessStart,
      accessEnd
    } = req.body;

    await User.findByIdAndUpdate(

      req.params.id,

      {
        planName,
        accessStart,
        accessEnd
      }
    );

    res.json({
      success: true,
      message: 'Plan updated'
    });

  }

  catch (error) {

    res.status(500).json({
      error: 'Failed to update plan'
    });
  }

});

/* ==========================================
   EXPORT
========================================== */

module.exports = {
  authRoutes: router,
  User
};