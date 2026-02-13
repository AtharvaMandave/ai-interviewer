require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const { requestId } = require('./middleware/request-id.middleware');

// Import routes
const healthRoutes = require('./routes/health.routes');
const questionRoutes = require('./routes/question.routes');
const rubricRoutes = require('./routes/rubric.routes');
const sessionRoutes = require('./routes/session.routes');
const aiRoutes = require('./routes/ai.routes');
const policyRoutes = require('./routes/policy.routes');
const interviewRoutes = require('./routes/interview.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const authRoutes = require('./routes/auth.routes');

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(requestId);
const passport = require('passport');
app.use(passport.initialize());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/rubrics', rubricRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'AI Interview Coach API',
        version: '1.0.0',
        status: 'running',
    });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`

Server:     http://localhost:${PORT}
API:        http://localhost:${PORT}/api
Health:     http://localhost:${PORT}/api/health
AI:         http://localhost:${PORT}/api/ai/health
Interview:  http://localhost:${PORT}/api/interview

  `);
});

module.exports = app;
