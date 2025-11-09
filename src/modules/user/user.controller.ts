import { BadRequestException, Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateCategoryDto } from '../category/dto/create-category.dto';
import { CreateUserDto } from './dto/register.dto';
import { GetCurrentResponseDto } from './dto/getCurrent.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JWTGuard } from '../auth/guards/verifyjwt.guard';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { User } from '@/models';
import { GetAllUserDto, UserResponseDto } from './dto/getAllUser.dto';
import { ResendRegistationDto, VerifyRegistationDto } from './dto/verifyRegistation.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) { }
  @Post('/create')
  @ApiOperation({ summary: 'Tạo mới người dùng' })
  @ApiBody({ type: CreateUserDto, required: true })
  Register(@Body() createData: CreateUserDto) {
    return this.userService.register(createData)
  }

  @Post('verify')
  @ApiBody({ type: VerifyRegistationDto, required: true })
  @ApiOperation({ summary: 'Xác thực người dùng' })
  verifyRegistation(@Body() data: VerifyRegistationDto) {
    return this.userService.verifyRegistation(data)
  }

  @Post('resend-verify')
  @ApiBody({ type: ResendRegistationDto , required: true })
  @ApiOperation({ summary: 'Resend verification email' })
  resendVerificationEmail(@Body() data: ResendRegistationDto) {
    return this.userService.resendVerificationEmail(data)
  }


  @UseGuards(JWTGuard)
  @Get('current')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin người dùng',
    type: GetCurrentResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa được xác thực'
  })
  async getCurrent(@Req() req: any) {
    let userId: number | null = null
    const authBearer = req.headers?.authorization
    if (authBearer && authBearer.startsWith('Bearer ')) {
      try {
        const token = authBearer.substring(7)
        const decoded = this.jwtService.verify(token, this.configService.get('JWT_SECRET')) as any
        userId = decoded.uid
      } catch (error) {
        userId = null
      }
    }
    if (!userId) throw new BadRequestException('User id not found!!!')
    return this.userService.getCurrentUser(userId);
  }

  @UseGuards(JWTGuard)
  @Put('update-profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin người dùng'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' }) // Thêm cho auth fail
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  @ApiResponse({ status: 409, description: 'Email hoặc phone đã tồn tại' })
  async updateProfileUser(@Body() data: UpdateProfileDto, @Req() req: any) {
    let userId: number | null = null
    const authBearer = req.headers?.authorization
    if (authBearer && authBearer.startsWith('Bearer ')) {
      try {
        const token = authBearer.substring(7)
        const decoded = this.jwtService.verify(token, this.configService.get('JWT_SECRET')) as any
        userId = decoded.uid
      } catch (error) {
        userId = null
      }
    }
    if (!userId) throw new BadRequestException('User id not found!!!')
    return this.userService.updateProfile(data, userId);
  }

  // @UseGuards(JWTGuard)
  @Get('getUsers')
  // @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lấy danh sách người dùng' })
  @ApiResponse({
    status: 200,
    type: UserResponseDto,
    description: 'Danh sách người dùng',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' }) // Thêm cho auth fail
  async getAllUser(@Query() query: GetAllUserDto, @Req() _req: any) {
    // let userId: number | null = null
    // const authBearer = req.headers?.authorization
    // if (authBearer && authBearer.startsWith('Bearer ')) {
    //   try {
    //     const token = authBearer.substring(7)
    //     const decoded = this.jwtService.verify(token, this.configService.get('JWT_SECRET')) as any
    //     userId = decoded.uid
    //   } catch (error) {
    //     userId = null
    //   }
    // }
    // if (!userId) throw new BadRequestException('User id not found!!!')
    return this.userService.getUsers(query);
  }

  @Get('getUser/:id')
  @ApiOperation({ summary: 'Lấy người dùng theo id' })
  @ApiResponse({
    status: 200,
    type: UserResponseDto,
    description: 'Thông tin người dùng'
  })
  async getUserById(@Param('id') id: number) {
    return this.userService.findById(id);
  }

}
