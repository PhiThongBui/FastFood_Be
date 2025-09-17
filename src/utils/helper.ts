import { BadRequestException } from "@nestjs/common";
import { Request, Response } from "express";

export class Helper {
    static converttoSlug(str: string): string {
        return str
            .normalize('NFD')                      // Tách dấu ra khỏi chữ (e.g., "ế" -> "e" + "́")
            .replace(/[\u0300-\u036f]/g, '')       // Xóa các dấu
            .replace(/đ/g, 'd')                    // Chuyển "đ" thành "d"
            .replace(/Đ/g, 'd')                    // Chuyển "Đ" thành "d"
            .toLowerCase()                         // Chuyển về chữ thường
            .trim()                                // Xóa khoảng trắng đầu cuối
            .replace(/[^a-z0-9\s-]/g, '')          // Xóa ký tự không mong muốn
            .replace(/\s+/g, '-')                  // Thay khoảng trắng bằng dấu gạch ngang
            .replace(/-+/g, '-');                  // Loại bỏ dấu gạch ngang thừa vd: xin chao--
    }

    static generateSessionId(): string {
        const timestamp = Date.now().toString();
        const randomStr = Math.random().toString(36).substring(2);
        return `guest_${timestamp}_${randomStr}`
    }

    static getSessionIdFromRequest(req: Request) {
        const cookie = req.cookies
        if (!cookie || !cookie.sessionId) return null
        return cookie.sessionId
    }

    static setSessionCookie(sessionId: string, res: Response) {
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
    }


    static isEqualArray = (arr1: number[], arr2: number[]): boolean => {
        if (arr1.length !== arr2.length) return false

        return arr1.every((val, index) => val === arr2[index])
    }
}