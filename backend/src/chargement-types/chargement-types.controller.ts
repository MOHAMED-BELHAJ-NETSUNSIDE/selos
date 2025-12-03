import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChargementTypesService } from './chargement-types.service';
import { CreateChargementTypeDto } from './dto/create-chargement-type.dto';
import { UpdateChargementTypeDto } from './dto/update-chargement-type.dto';

@ApiTags('Chargement Types')
@Controller('chargement-types')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ChargementTypesController {
  constructor(private readonly chargementTypesService: ChargementTypesService) {}

  @Get()
  @Permissions('chargement-type:read')
  @ApiOperation({ summary: 'List all chargement types' })
  findAll() {
    return this.chargementTypesService.findAll();
  }

  @Get('products/available')
  @Permissions('chargement-type:read')
  @ApiOperation({ summary: 'Get all available products' })
  getAvailableProducts() {
    return this.chargementTypesService.getAvailableProducts();
  }

  @Get('by-salesperson/:salespersonId')
  @Permissions('chargement-type:read')
  @ApiOperation({ summary: 'Get chargement type by salesperson id' })
  findBySalesperson(@Param('salespersonId') salespersonId: string) {
    return this.chargementTypesService.findBySalesperson(Number(salespersonId));
  }

  @Get(':id')
  @Permissions('chargement-type:read')
  @ApiOperation({ summary: 'Get chargement type by id' })
  findOne(@Param('id') id: string) {
    return this.chargementTypesService.findOne(Number(id));
  }

  @Post()
  @Permissions('chargement-type:write')
  @ApiOperation({ summary: 'Create chargement type' })
  create(@Body() dto: CreateChargementTypeDto, @CurrentUser() user: any) {
    return this.chargementTypesService.create(dto, user.id);
  }

  @Patch(':id')
  @Permissions('chargement-type:write')
  @ApiOperation({ summary: 'Update chargement type' })
  update(@Param('id') id: string, @Body() dto: UpdateChargementTypeDto) {
    return this.chargementTypesService.update(Number(id), dto);
  }

  @Delete(':id')
  @Permissions('chargement-type:delete')
  @ApiOperation({ summary: 'Delete chargement type' })
  remove(@Param('id') id: string) {
    return this.chargementTypesService.remove(Number(id));
  }

  @Post(':id/duplicate')
  @Permissions('chargement-type:write')
  @ApiOperation({ summary: 'Duplicate chargement type to another salesperson' })
  duplicate(@Param('id') id: string, @Body() dto: { salespersonId: number }) {
    return this.chargementTypesService.duplicate(Number(id), dto.salespersonId);
  }
}

