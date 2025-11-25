// interceptors/serialize.interceptor.ts
import {
  UseInterceptors,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance } from 'class-transformer';

interface ClassConstructor {
  new (...args: any[]): {};
}

export function Serialize(dto: ClassConstructor) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: any) {}

  intercept(_context: ExecutionContext, handler: CallHandler): Observable<any> {
    return handler.handle().pipe(
      map((data: any) => {
        // Convert Sequelize models to plain objects
        const plainData = this.toPlainObject(data);

        return plainToInstance(this.dto, plainData, {
          excludeExtraneousValues: true,
          enableImplicitConversion: true, // Quan trọng cho nested objects
        });
      }),
    );
  }

  private toPlainObject(data: any): any {
    if (!data) return data;

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.toPlainObject(item));
    }

    // Handle Sequelize instances
    if (data.get && typeof data.get === 'function') {
      return data.get({ plain: true });
    }

    // Handle plain objects with nested Sequelize instances
    if (typeof data === 'object') {
      const result: any = {};
      for (const key in data) {
        result[key] = this.toPlainObject(data[key]);
      }
      return result;
    }

    return data;
  }
}
