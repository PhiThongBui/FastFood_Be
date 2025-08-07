
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger, HttpStatus } from '@nestjs/common';
import e, { Request, Response } from 'express';
import { ApiResponse } from '../interfaces';
import { log } from 'node:console';

@Catch(HttpException)
export class AllExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionFilter.name);
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const startTime = request['startTime']
        const endTime = Date.now();
        const takenTime = endTime - startTime;
        let status: number
        let message: string
        let error: string | string[] | undefined = undefined;
        if (exception instanceof HttpException) {
            //lỗi biết trước được 
            status = exception.getStatus()
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse
            } else if (typeof exceptionResponse === 'object') {
                const errorResponse = exceptionResponse as Record<string, any>
                message = errorResponse?.message || errorResponse?.error || 'Internal Server Errorr'
                error = errorResponse?.error
                //Lỗi DTO
                if (Array.isArray(errorResponse.message)) {
                    message = "Dữ liệu không hợp lệ",
                        error = errorResponse.message as any
                }
            } else {
                message = "Internal Server Error"
            }
        } else {
            //lỗi ngoài ý muốn
            status = HttpStatus.INTERNAL_SERVER_ERROR
            message = "Internal Server Error"
            this.logger.error(exception)
        }

        const errorResponse: ApiResponse<any> = {
            success: false,
            error,
            message,
            path: request.url,
            date: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false }),
            takenTime: `${takenTime}ms`
        };

        response.status(status).json(errorResponse);
    }
}
