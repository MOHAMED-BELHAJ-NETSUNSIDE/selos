import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ZonesService } from './zones.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@ApiTags('Zones')
@Controller('zones')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get()
  @Permissions('zone:read')
  @ApiOperation({ summary: 'List zones' })
  findAll() { return this.zonesService.findAll(); }

  @Get(':id')
  @Permissions('zone:read')
  @ApiOperation({ summary: 'Get zone by id' })
  findOne(@Param('id') id: string) { return this.zonesService.findOne(Number(id)); }

  @Post()
  @Permissions('zone:write')
  @ApiOperation({ summary: 'Create zone' })
  create(@Body() dto: CreateZoneDto) { return this.zonesService.create(dto); }

  @Patch(':id')
  @Permissions('zone:write')
  @ApiOperation({ summary: 'Update zone' })
  update(@Param('id') id: string, @Body() dto: UpdateZoneDto) { return this.zonesService.update(Number(id), dto); }

  @Delete(':id')
  @Permissions('zone:delete')
  @ApiOperation({ summary: 'Delete zone' })
  remove(@Param('id') id: string) { return this.zonesService.remove(Number(id)); }
}


