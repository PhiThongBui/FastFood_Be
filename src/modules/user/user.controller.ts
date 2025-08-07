import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateCategoryDto } from '../category/dto/create-category.dto';
import { CreateUserDto } from './dto/register.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  Register(@Body() createData:CreateUserDto){
    return this.userService.register(createData)
  }
}
