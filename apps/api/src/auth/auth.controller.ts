import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtGuard } from './jwt/jwt.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Post('login')
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @Post('otp/request')
  requestOtp(@Body() data: RequestOtpDto) {
    return this.authService.requestOtp(data.phone);
  }

  @Post('otp/verify')
  verifyOtp(@Body() data: VerifyOtpDto) {
    return this.authService.verifyOtp(data.phone, data.code);
  }

  @Post('refresh')
  refresh(@Body() data: RefreshDto) {
    return this.authService.refresh(data.refreshToken);
  }

  @Post('logout')
  logout(@Body() data: RefreshDto) {
    return this.authService.logout(data.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('profile')
  profile(@Req() req: AuthenticatedRequest) {
    return req.user;
  }
}
