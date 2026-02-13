const express = require('express');
const router = express.Router();
const authService = require('../services/auth.service');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email, password and name'
            });
        }

        // Use authService instance
        const result = await authService.register(email, password, name);

        res.status(201).json({
            success: true,
            data: result.user,
            token: result.token,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const result = await authService.login(email, password);

        res.json({
            success: true,
            data: result.user,
            token: result.token,
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }
});

// Protected routes
router.get('/me', protect, async (req, res) => {
    try {
        res.json({
            success: true,
            data: req.user,
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }
});

// Google Auth
const passport = require('../config/passport');

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
}));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    (req, res) => {
        // Successful authentication, redirect to frontend with token
        const { token } = req.user;
        const redirectUrl = process.env.CLIENT_URL
            ? `${process.env.CLIENT_URL}/auth-callback?token=${token}`
            : `http://localhost:3000/auth-callback?token=${token}`;

        res.redirect(redirectUrl);
    }
);

module.exports = router;
