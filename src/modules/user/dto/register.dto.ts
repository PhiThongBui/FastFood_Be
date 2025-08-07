import { StringRequired } from "@/common/decorators";

export class CreateUserDto{
    @StringRequired('Tên người dùng')
    name: string

    @StringRequired('Email')
    email: string

    @StringRequired('Password')
    password: string
}