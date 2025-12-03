import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { TypeVentesService } from './type-ventes.service';
import { CreateTypeVenteDto } from './dto/create-type-vente.dto';
import { UpdateTypeVenteDto } from './dto/update-type-vente.dto';

@ApiTags('Type Ventes')
@Controller('type-ventes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class TypeVentesController {
  constructor(private readonly typeVentesService: TypeVentesService) {}

  @Get()
  @Permissions('type-vente:read')
  @ApiOperation({ summary: 'List type ventes' })
  findAll() { return this.typeVentesService.findAll(); }

  @Get(':id')
  @Permissions('type-vente:read')
  @ApiOperation({ summary: 'Get type vente by id' })
  findOne(@Param('id') id: string) { return this.typeVentesService.findOne(Number(id)); }

  @Post()
  @Permissions('type-vente:write')
  @ApiOperation({ summary: 'Create type vente' })
  create(@Body() dto: CreateTypeVenteDto) { return this.typeVentesService.create(dto); }

  @Patch(':id')
  @Permissions('type-vente:write')
  @ApiOperation({ summary: 'Update type vente' })
  update(@Param('id') id: string, @Body() dto: UpdateTypeVenteDto) { return this.typeVentesService.update(Number(id), dto); }

  @Delete(':id')
  @Permissions('type-vente:delete')
  @ApiOperation({ summary: 'Delete type vente' })
  remove(@Param('id') id: string) { return this.typeVentesService.remove(Number(id)); }
}


