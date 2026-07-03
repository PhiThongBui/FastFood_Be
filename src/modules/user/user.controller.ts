import { BadRequestException, Body, Controller, Get, Param, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
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
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) { }
  @Post('/create')
  @ApiOperation({ summary: 'Táº¡o má»›i ngÆ°á»i dÃ¹ng' })
  @ApiBody({ type: CreateUserDto, required: true })
  Register(@Body() createData: CreateUserDto) {
    return this.userService.register(createData)
  }

  @Post('verify')
  @ApiBody({ type: VerifyRegistationDto, required: true })
  @ApiOperation({ summary: 'XÃ¡c thá»±c ngÆ°á»i dÃ¹ng' })
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
  @Post('upload-avatar')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload avatar ngÆ°á»i dÃ¹ng' })
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const uploadPath = './uploads/avatars';
          mkdirSync(uploadPath, { recursive: true });
          callback(null, uploadPath);
        },
        filename: (_req, file, callback) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, `avatar-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp|gif)$/)) {
          return callback(new BadRequestException('Chá»‰ há»— trá»£ file áº£nh'), false);
        }

        callback(null, true);
      },
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
    }),
  )
  uploadAvatar(@UploadedFile() file: { filename: string } | undefined, @Req() req: any) {
    if (!file) throw new BadRequestException('Avatar file is required');

    const protocol = req.protocol;
    const host = req.get('host');
    const avatarUrl = `${protocol}://${host}/uploads/avatars/${file.filename}`;

    return {
      message: 'Upload avatar successfully',
      data: {
        avatar: avatarUrl,
      },
    };
  }

  @UseGuards(JWTGuard)
  @Get('current')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Láº¥y thÃ´ng tin ngÆ°á»i dÃ¹ng hiá»‡n táº¡i' })
  @ApiResponse({
    status: 200,
    description: 'ThÃ´ng tin ngÆ°á»i dÃ¹ng',
    type: GetCurrentResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'ChÆ°a Ä‘Æ°á»£c xÃ¡c thá»±c'
  })
  async getCurrent(@Req() req: any) {
    let userId: number | null = null
    const authBearer = req.headers?.authorization
    if (authBearer && authBearer.startsWith('Bearer ')) {
      try {
        const token = authBearer.substring(7)
        const decoded = this.jwtService.verify(token, this.configService.get('JWT_SECRET')) as any
        userId = decoded.uid
      } catch (error: any) {
        userId = null
      }
    }
    if (!userId) throw new BadRequestException('User id not found!!!')
    return this.userService.getCurrentUser(userId);
  }

  @UseGuards(JWTGuard)
  @Put('update-profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cáº­p nháº­t thÃ´ng tin ngÆ°á»i dÃ¹ng' })
  @ApiResponse({
    status: 200,
    description: 'Cáº­p nháº­t thÃ´ng tin ngÆ°á»i dÃ¹ng'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' }) // ThÃªm cho auth fail
  @ApiResponse({ status: 404, description: 'NgÆ°á»i dÃ¹ng khÃ´ng tá»“n táº¡i' })
  @ApiResponse({ status: 409, description: 'Email hoáº·c phone Ä‘Ã£ tá»“n táº¡i' })
  async updateProfileUser(@Body() data: UpdateProfileDto, @Req() req: any) {
    let userId: number | null = null
    const authBearer = req.headers?.authorization
    if (authBearer && authBearer.startsWith('Bearer ')) {
      try {
        const token = authBearer.substring(7)
        const decoded = this.jwtService.verify(token, this.configService.get('JWT_SECRET')) as any
        userId = decoded.uid
      } catch (error: any) {
        userId = null
      }
    }
    if (!userId) throw new BadRequestException('User id not found!!!')
    return this.userService.updateProfile(data, userId);
  }

  // @UseGuards(JWTGuard)
  @Get('getUsers')
  // @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Láº¥y danh sÃ¡ch ngÆ°á»i dÃ¹ng' })
  @ApiResponse({
    status: 200,
    type: UserResponseDto,
    description: 'Danh sÃ¡ch ngÆ°á»i dÃ¹ng',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' }) // ThÃªm cho auth fail
  async getAllUser(@Query() query: GetAllUserDto, @Req() _req: any) {
    // let userId: number | null = null
    // const authBearer = req.headers?.authorization
    // if (authBearer && authBearer.startsWith('Bearer ')) {
    //   try {
    //     const token = authBearer.substring(7)
    //     const decoded = this.jwtService.verify(token, this.configService.get('JWT_SECRET')) as any
    //     userId = decoded.uid
    //   } catch (error: any) {
    //     userId = null
    //   }
    // }
    // if (!userId) throw new BadRequestException('User id not found!!!')
    return this.userService.getUsers(query);
  }

  @Get('getUser/:id')
  @ApiOperation({ summary: 'Láº¥y ngÆ°á»i dÃ¹ng theo id' })
  @ApiResponse({
    status: 200,
    type: UserResponseDto,
    description: 'ThoÌ‚ng tin nguÌ›oÌ›Ì€i duÌ€ng'
  })
  async getUserById(@Param('id') id: number) {
    return this.userService.findById(id);
  }

}
