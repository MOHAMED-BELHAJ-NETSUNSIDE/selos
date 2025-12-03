import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { SecteursService } from './secteurs.service';
import { CreateSecteurDto } from './dto/create-secteur.dto';
import { UpdateSecteurDto } from './dto/update-secteur.dto';

@ApiTags('Secteurs')
@Controller('secteurs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SecteursController {
  constructor(private readonly secteursService: SecteursService) {}

  @Get()
  @Permissions('secteur:read')
  @ApiOperation({ summary: 'List secteurs' })
  findAll() { return this.secteursService.findAll(); }

  @Get(':id')
  @Permissions('secteur:read')
  @ApiOperation({ summary: 'Get secteur by id' })
  findOne(@Param('id') id: string) { return this.secteursService.findOne(Number(id)); }

  @Post()
  @Permissions('secteur:write')
  @ApiOperation({ summary: 'Create secteur' })
  create(@Body() dto: CreateSecteurDto) { return this.secteursService.create(dto); }

  @Patch(':id')
  @Permissions('secteur:write')
  @ApiOperation({ summary: 'Update secteur' })
  update(@Param('id') id: string, @Body() dto: UpdateSecteurDto) { return this.secteursService.update(Number(id), dto); }

  @Delete(':id')
  @Permissions('secteur:delete')
  @ApiOperation({ summary: 'Delete secteur' })
  remove(@Param('id') id: string) { return this.secteursService.remove(Number(id)); }

  // Zones links
  @Get(':id/zones')
  @Permissions('secteur:read')
  listZones(@Param('id') id: string) { return this.secteursService.listZones(Number(id)); }

  @Post(':id/zones/:zoneId')
  @Permissions('secteur:write')
  addZone(@Param('id') id: string, @Param('zoneId') zoneId: string) {
    return this.secteursService.addZone(Number(id), Number(zoneId));
  }

  @Delete(':id/zones/:zoneId')
  @Permissions('secteur:write')
  removeZone(@Param('id') id: string, @Param('zoneId') zoneId: string) {
    return this.secteursService.removeZone(Number(id), Number(zoneId));
  }

  // Type ventes links
  @Get(':id/type-ventes')
  @Permissions('secteur:read')
  listTypeVentes(@Param('id') id: string) { return this.secteursService.listTypeVentes(Number(id)); }

  @Post(':id/type-ventes/:typeVenteId')
  @Permissions('secteur:write')
  addTypeVente(@Param('id') id: string, @Param('typeVenteId') typeVenteId: string) {
    return this.secteursService.addTypeVente(Number(id), Number(typeVenteId));
  }

  @Delete(':id/type-ventes/:typeVenteId')
  @Permissions('secteur:write')
  removeTypeVente(@Param('id') id: string, @Param('typeVenteId') typeVenteId: string) {
    return this.secteursService.removeTypeVente(Number(id), Number(typeVenteId));
  }
}
