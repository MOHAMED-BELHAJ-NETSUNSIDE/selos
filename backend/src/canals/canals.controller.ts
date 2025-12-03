import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CanalsService } from './canals.service';
import { CreateCanalDto } from './dto/create-canal.dto';
import { UpdateCanalDto } from './dto/update-canal.dto';

@ApiTags('Canals')
@Controller('canals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class CanalsController {
  constructor(private readonly canalsService: CanalsService) {}

  @Get()
  @Permissions('canal:read')
  @ApiOperation({ summary: 'List canals' })
  findAll() { return this.canalsService.findAll(); }

  @Get(':id')
  @Permissions('canal:read')
  @ApiOperation({ summary: 'Get canal by id' })
  findOne(@Param('id') id: string) { return this.canalsService.findOne(Number(id)); }

  @Post()
  @Permissions('canal:write')
  @ApiOperation({ summary: 'Create canal' })
  create(@Body() dto: CreateCanalDto) { return this.canalsService.create(dto); }

  @Patch(':id')
  @Permissions('canal:write')
  @ApiOperation({ summary: 'Update canal' })
  update(@Param('id') id: string, @Body() dto: UpdateCanalDto) { return this.canalsService.update(Number(id), dto); }

  @Delete(':id')
  @Permissions('canal:delete')
  @ApiOperation({ summary: 'Delete canal' })
  remove(@Param('id') id: string) { return this.canalsService.remove(Number(id)); }
}


