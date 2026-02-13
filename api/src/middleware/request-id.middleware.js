const { v4: uuid } = require('uuid');

/**
 * Adds request ID to each request
 */
function requestId(req, res, next) {
    req.id = req.headers['x-request-id'] || uuid();
    res.setHeader('X-Request-Id', req.id);
    next();
}

module.exports = { requestId };
