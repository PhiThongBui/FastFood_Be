
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JWTGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any, info: any) {        
        if (err || !user) {
            if (info?.name === 'TokenExpiredError') {
                throw new UnauthorizedException('Token has expired');
            }
            else if (info?.name === 'JsonWebTokenError') {
                throw new UnauthorizedException('Invalid token');
            }
            else throw new UnauthorizedException('You do not have access!!!')
        }
        return user
    }
}
