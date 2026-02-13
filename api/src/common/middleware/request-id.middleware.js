const { Injectable, NestMiddleware } = require('@nestjs/common');
const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to add request ID for tracing
 */
@Injectable()
class RequestIdMiddleware {
    use(req, res, next) {
        const requestId = req.headers['x-request-id'] || uuidv4();
        req.requestId = requestId;
        res.setHeader('x-request-id', requestId);
        next();
    }
}

module.exports = { RequestIdMiddleware };
