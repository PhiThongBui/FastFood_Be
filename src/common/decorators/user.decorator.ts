import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const GetUser = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user      
        console.log("data", data);
        
        console.log("user", user);
        
        return data ? user?.[data] : user
    }
)