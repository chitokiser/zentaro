import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { RequireAdminLevel } from './admin-level.decorator';
import { CurrentUser } from './current-user.decorator';
import type { CurrentUserPayload } from './current-user.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { ShippingAddressDto } from './dto/shipping-address.dto';
import { SetAdminLevelDto } from './dto/set-admin-level.dto';
import { PromoteAdminDto } from './dto/promote-admin.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('google')
  googleLogin(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getMe(user.uid);
  }

  @Get('shipping-address')
  @UseGuards(JwtAuthGuard)
  getShippingAddress(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getShippingAddress(user.uid);
  }

  @Put('shipping-address')
  @UseGuards(JwtAuthGuard)
  updateShippingAddress(@CurrentUser() user: CurrentUserPayload, @Body() dto: ShippingAddressDto) {
    return this.authService.updateShippingAddress(user.uid, dto);
  }

  @Get('admin-users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(1)
  listAdminUsers() {
    return this.authService.listAdminUsers();
  }

  @Post('admin-users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(1)
  promoteAdmin(@Body() dto: PromoteAdminDto, @CurrentUser() user: CurrentUserPayload) {
    return this.authService.promoteByEmail(dto.email, dto.adminLevel, user.email);
  }

  @Patch('admin-users/:uid/level')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(1)
  setAdminLevel(
    @Param('uid') uid: string,
    @Body() dto: SetAdminLevelDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.authService.setAdminLevel(uid, dto.adminLevel, user.email);
  }
}
