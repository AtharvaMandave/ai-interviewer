const { createParamDecorator, ExecutionContext } = require('@nestjs/common');

/**
 * Custom decorator to extract user from request
 * Usage: @User() user or @User('id') userId
 */
const User = createParamDecorator((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
        return null;
    }

    return data ? user[data] : user;
});

module.exports = { User };
