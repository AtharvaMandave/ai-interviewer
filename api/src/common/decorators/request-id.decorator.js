const { createParamDecorator, ExecutionContext } = require('@nestjs/common');

/**
 * Custom decorator to extract request ID from headers
 * Usage: @RequestId() requestId
 */
const RequestId = createParamDecorator((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-request-id'] || request.requestId;
});

module.exports = { RequestId };
