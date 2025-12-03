import { Controller, Get, UseGuards, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { TypeUsersService } from './type-users.service';
import { CreateTypeUserDto } from './dto/create-type-user.dto';
import { UpdateTypeUserDto } from './dto/update-type-user.dto';

@ApiTags('Type Users')
@Controller('type-users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class TypeUsersController {
  constructor(private readonly typeUsersService: TypeUsersService) {}

  @Get()
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get all type users' })
  @ApiResponse({ status: 200, description: 'Type users retrieved successfully' })
  findAll() {
    return this.typeUsersService.findAll();
  }

  @Get(':id')
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get a type user by id' })
  findOne(@Param('id') id: string) {
    return this.typeUsersService.findOne(Number(id));
  }

  @Post()
  @Permissions('users:write')
  @ApiOperation({ summary: 'Create a type user' })
  create(@Body() dto: CreateTypeUserDto) {
    return this.typeUsersService.create(dto);
  }

  @Patch(':id')
  @Permissions('users:write')
  @ApiOperation({ summary: 'Update a type user' })
  update(@Param('id') id: string, @Body() dto: UpdateTypeUserDto) {
    return this.typeUsersService.update(Number(id), dto);
  }

  @Delete(':id')
  @Permissions('users:delete')
  @ApiOperation({ summary: 'Delete a type user' })
  remove(@Param('id') id: string) {
    return this.typeUsersService.remove(Number(id));
  }
}
