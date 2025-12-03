import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { SousRegionsService } from './sous-regions.service';
import { CreateSousRegionDto } from './dto/create-sous-region.dto';
import { UpdateSousRegionDto } from './dto/update-sous-region.dto';

@ApiTags('Sous-régions')
@Controller('sous-regions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SousRegionsController {
  constructor(private readonly sousRegionsService: SousRegionsService) {}

  @Get()
  @Permissions('sous-region:read')
  @ApiOperation({ summary: 'List sous-régions' })
  findAll() { return this.sousRegionsService.findAll(); }

  @Get(':id')
  @Permissions('sous-region:read')
  @ApiOperation({ summary: 'Get sous-région by id' })
  findOne(@Param('id') id: string) { return this.sousRegionsService.findOne(Number(id)); }

  @Post()
  @Permissions('sous-region:write')
  @ApiOperation({ summary: 'Create sous-région' })
  create(@Body() dto: CreateSousRegionDto) { return this.sousRegionsService.create(dto); }

  @Patch(':id')
  @Permissions('sous-region:write')
  @ApiOperation({ summary: 'Update sous-région' })
  update(@Param('id') id: string, @Body() dto: UpdateSousRegionDto) { return this.sousRegionsService.update(Number(id), dto); }

  @Delete(':id')
  @Permissions('sous-region:delete')
  @ApiOperation({ summary: 'Delete sous-région' })
  remove(@Param('id') id: string) { return this.sousRegionsService.remove(Number(id)); }
}


