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
                const formattedMessage =
                    typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean'
                        ? String(data)
                        : (data !== null && data !== undefined && typeof data === 'object' && 'message' in data)
                            ? (data as any).message
                            : this.getDefaultMessage(method);

                const formattedData = (item: any) => {

                    if (!item || typeof item !== 'object') {
                        // item là undefined, null, string, number, boolean, etc.
                        return item;
                    }
                    //TH chỉ có message
                    if (item && typeof item === 'object' && item !== null && 'message' in item && Object.keys(item).length === 1) {
                        return undefined
                    }

                    //TH chỉ có data hoặc có message lẫn data
                    if (item && typeof item === 'object' && item !== null && 'data' in item && Object.keys(item).length === 1 || (item !== null && 'data' in item && Object.keys(item).length === 2)) {                        
                        return item?.data
                    }

                    if (item && typeof item === 'object' && item !== null && 'message' in item && Object.keys(item).length === 2) {
                        const { message, ...rest } = item
                        return rest
                    }

                    const serialize = (val: any) => typeof val?.toJSON === 'function' ? val.toJSON() : val;

                    if (Array.isArray(item)) {
                        return item.map(serialize);
                    }

                    if (typeof item === 'object' && item !== null) {
                        return serialize(item);
                    }

                    return item;
                }
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


