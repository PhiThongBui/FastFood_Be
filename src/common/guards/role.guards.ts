import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // --- SỨC MẠNH CỦA GUARD NẰM Ở ĐÂY ---
    
    // 1. Context giúp Guard biết: "Tôi đang đứng trước hàm nào?"
    // Lấy metadata 'roles' được gắn trên Controller (ví dụ @Roles('admin'))
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );    
    if (!requiredRoles) {
      return true; // Nếu không yêu cầu quyền gì thì cho qua
    }

    // 2. Context giúp Guard lấy User đang đăng nhập ra
    const request = context.switchToHttp().getRequest();
    const user = request.user; // User này có được nhờ bước AuthGuard trước đó
    // 3. So sánh
    return requiredRoles.includes(user.role);
  }
}