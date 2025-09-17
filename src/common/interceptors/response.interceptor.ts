import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces';
import { log } from 'node:console';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {

    private getDefaultMessage(message: string): string {
        switch (message) {
            case 'POST':
                return 'Tạo mới thành công';
            case 'PATCH':
                return 'Chỉnh sửa thành công';
            case 'DELETE':
                return 'Xóa thành công';
            case 'GET':
                return 'Lấy dữ liệu thành công';
            default:
                return 'Yêu cầu API thành công';
        }
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
        return next.handle().pipe(
            map(data => {
                const method = context.switchToHttp().getRequest().method;
                const path = context.switchToHttp().getRequest().path;
                const request = context.switchToHttp().getRequest();

                const startTime = request['startTime']
                const endTime = Date.now();
                const takenTime = endTime - startTime;

                const formattedMessage = typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean'
                    ? String(data)
                    : (data !== null && data !== undefined && typeof data === 'object' && 'message' in data)
                        ? (data as any).message
                        : this.getDefaultMessage(method);

                const formattedData = (item: any) => {
                    if (!item || typeof item !== 'object') return item;

                    const keys = Object.keys(item);

                    // chỉ có message
                    if ('message' in item && keys.length === 1) {
                        return undefined;
                    }

                    // chỉ có data -> unwrap
                    if ('data' in item && keys.length === 1) {
                        return item.data;
                    }

                    if ('data' in item && 'message' in item && (keys.length > 2 || keys.length === 2)) {
                        return item.data;
                    }

                    // có message + field khác
                    if ('message' in item && keys.length > 1) {
                        const { message, ...rest } = item;
                        return rest;
                    }

                    if (Array.isArray(item)) {
                        return item.map(val => typeof val?.toJSON === 'function' ? val.toJSON() : val);
                    }

                    if (typeof item.toJSON === 'function') {
                        return item.toJSON();
                    }

                    return item;
                };



                const finalData = formattedData(data)
                return {
                    success: true,
                    message: formattedMessage,
                    data: finalData,
                    date: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false }),
                    path: path, //path
                    takenTime: `${takenTime}ms`
                }
            })
        );
    }
}


// Logger.log(data);


