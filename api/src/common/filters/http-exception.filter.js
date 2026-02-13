const { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } = require('@nestjs/common');

/**
 * Global HTTP exception filter
 */
@Catch()
class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const message = exception instanceof HttpException
            ? exception.getResponse()
            : 'Internal server error';

        const errorResponse = {
            success: false,
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message: typeof message === 'string' ? message : message.message || message,
            ...(process.env.NODE_ENV === 'development' && {
                stack: exception.stack,
            }),
        };

        // Log error
        console.error(`[ERROR] ${request.method} ${request.url}`, {
            status,
            message: errorResponse.message,
            stack: exception.stack,
        });

        response.status(status).json(errorResponse);
    }
}

module.exports = { HttpExceptionFilter };
