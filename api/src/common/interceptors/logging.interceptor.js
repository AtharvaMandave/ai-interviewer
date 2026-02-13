const { Injectable, NestInterceptor, ExecutionContext, CallHandler } = require('@nestjs/common');
const { Observable, tap } = require('rxjs');

/**
 * Interceptor to log request/response details
 */
@Injectable()
class LoggingInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const { method, url, body } = request;
        const requestId = request.headers['x-request-id'] || 'N/A';
        const startTime = Date.now();

        console.log(`[${requestId}] --> ${method} ${url}`,
            process.env.NODE_ENV === 'development' ? JSON.stringify(body) : '');

        return next.handle().pipe(
            tap({
                next: (data) => {
                    const duration = Date.now() - startTime;
                    console.log(`[${requestId}] <-- ${method} ${url} ${duration}ms`);
                },
                error: (error) => {
                    const duration = Date.now() - startTime;
                    console.error(`[${requestId}] <-- ${method} ${url} ${duration}ms ERROR: ${error.message}`);
                },
            }),
        );
    }
}

module.exports = { LoggingInterceptor };
