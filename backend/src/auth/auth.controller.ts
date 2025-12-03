import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginSalespersonDto } from './dto/login-salesperson.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  @Post('login-salesperson')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Salesperson login for Selos Retails' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async loginSalesperson(@Body() loginDto: LoginSalespersonDto): Promise<AuthResponseDto> {
    try {
      return await this.authService.loginSalesperson(loginDto.login, loginDto.password);
    } catch (error) {
      console.error('Salesperson login error:', error);
      throw error;
    }
  }
}




