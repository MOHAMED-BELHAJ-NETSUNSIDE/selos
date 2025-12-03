import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@ApiTags('Regions')
@Controller('regions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  @Permissions('region:read')
  findAll() { return this.regionsService.findAll(); }

  @Get(':id')
  @Permissions('region:read')
  findOne(@Param('id') id: string) { return this.regionsService.findOne(Number(id)); }

  @Post()
  @Permissions('region:write')
  create(@Body() dto: CreateRegionDto) { return this.regionsService.create(dto); }

  @Patch(':id')
  @Permissions('region:write')
  update(@Param('id') id: string, @Body() dto: UpdateRegionDto) { return this.regionsService.update(Number(id), dto); }

  @Delete(':id')
  @Permissions('region:delete')
  remove(@Param('id') id: string) { return this.regionsService.remove(Number(id)); }

  // Sous-regions links
  @Get(':id/sous-regions')
  @Permissions('region:read')
  @ApiOperation({ summary: 'List sous-regions for a region' })
  listSousRegions(@Param('id') id: string) { return this.regionsService.listSousRegions(Number(id)); }

  @Post(':id/sous-regions/:sousRegionId')
  @Permissions('region:write')
  @ApiOperation({ summary: 'Link a sous-region to a region' })
  addSousRegion(@Param('id') id: string, @Param('sousRegionId') sousRegionId: string) {
    return this.regionsService.addSousRegion(Number(id), Number(sousRegionId));
  }

  @Delete(':id/sous-regions/:sousRegionId')
  @Permissions('region:write')
  @ApiOperation({ summary: 'Unlink a sous-region from a region' })
  removeSousRegion(@Param('id') id: string, @Param('sousRegionId') sousRegionId: string) {
    return this.regionsService.removeSousRegion(Number(id), Number(sousRegionId));
  }
}

