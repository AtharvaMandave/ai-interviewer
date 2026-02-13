const { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException } = require('@nestjs/common');
const { Observable, throwError, TimeoutError } = require('rxjs');
const { catchError, timeout } = require('rxjs/operators');

/**
 * Interceptor to enforce request timeout
 */
@Injectable()
class TimeoutInterceptor {
    constructor(timeoutMs = 30000) {
        this.timeoutMs = timeoutMs;
    }

    intercept(context, next) {
        return next.handle().pipe(
            timeout(this.timeoutMs),
            catchError((err) => {
                if (err instanceof TimeoutError) {
                    return throwError(() => new RequestTimeoutException('Request timed out'));
                }
                return throwError(() => err);
            }),
        );
    }
}

module.exports = { TimeoutInterceptor };
