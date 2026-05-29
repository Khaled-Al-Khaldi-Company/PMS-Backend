import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ReadOnlyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if the user is authenticated and has the 'Viewer' role
    // and is performing a write operation (POST, PUT, PATCH, DELETE)
    if (user && user.role === 'Viewer' && request.method !== 'GET') {
      throw new ForbiddenException(
        'عفواً، لا تملك الصلاحية لإجراء هذا التعديل (حساب للعرض فقط).',
      );
    }

    return next.handle();
  }
}
