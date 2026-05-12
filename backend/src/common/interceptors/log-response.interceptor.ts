import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import logger from '../logger';

@Injectable()
export class LogResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        const duration = Date.now() - start;
        const logEntry = {
          path: req.url,
          method: req.method,
          timestamp: new Date().toISOString(),
          durationMs: duration,
          status: 'success',
          statusCode: res?.statusCode ?? 200,
        };

        logger.info(logEntry);

        if (data && typeof data === 'object' && !Array.isArray(data)) {
          return { ...data, logs: [logEntry] };
        }

        return { data, logs: [logEntry] };
      }),
      catchError((err) => {
        const duration = Date.now() - start;
        const errEntry = {
          path: req.url,
          method: req.method,
          timestamp: new Date().toISOString(),
          durationMs: duration,
          status: 'failure',
          statusCode: err?.status || res?.statusCode || 500,
          message: err?.message ?? String(err),
        };

        logger.error(errEntry);
        return throwError(() => err);
      }),
    );
  }
}
