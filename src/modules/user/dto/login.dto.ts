import { StringRequired } from "@/common/decorators";

export class LoginDto{
    @StringRequired('Email')
    email: string

    @StringRequired('Password')
    password: string
}