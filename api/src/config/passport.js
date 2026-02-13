const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const authService = require('../services/auth.service');

const callbackURL = process.env.GOOGLE_CALLBACK_URL || (process.env.SERVER_URL
    ? `${process.env.SERVER_URL}/api/auth/google/callback`
    : "http://localhost:3000/api/auth/google/callback");

console.log('--------------------------------------------------');
console.log('🔹 OAuth Callback URL configured as:', callbackURL);
console.log('--------------------------------------------------');

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'your-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-client-secret',
    callbackURL: callbackURL,
},
    async function (accessToken, refreshToken, profile, cb) {
        try {
            const result = await authService.validateOAuthUser(profile, 'google');
            // We pass the token to the callback to redirect with it
            return cb(null, result);
        } catch (err) {
            return cb(err);
        }
    }
));

module.exports = passport;
