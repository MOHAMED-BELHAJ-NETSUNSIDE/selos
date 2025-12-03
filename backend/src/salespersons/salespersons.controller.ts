import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SalespersonsService } from './salespersons.service';
import { CreateSalespersonDto } from './dto/create-salesperson.dto';
import { UpdateSalespersonDto } from './dto/update-salesperson.dto';
import { QuerySalespersonDto } from './dto/query-salesperson.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Salespersons')
@Controller('salespersons')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SalespersonsController {
  constructor(private readonly salespersonsService: SalespersonsService) {}

  @Post()
  @Permissions('salesperson:write')
  @ApiOperation({ summary: 'Créer un nouveau vendeur' })
  @ApiResponse({ status: 201, description: 'Vendeur créé avec succès' })
  @ApiResponse({ status: 409, description: 'Conflit (login ou code déjà utilisé)' })
  async create(@Body() createSalespersonDto: CreateSalespersonDto, @CurrentUser() user: any) {
    return await this.salespersonsService.create(createSalespersonDto, user.id);
  }

  @Get()
  @Permissions('salesperson:read')
  @ApiOperation({ summary: 'Obtenir tous les vendeurs avec pagination et recherche' })
  @ApiResponse({ status: 200, description: 'Liste des vendeurs récupérée avec succès' })
  findAll(@Query() query: QuerySalespersonDto, @CurrentUser() user: any) {
    return this.salespersonsService.findAll(query, user);
  }

  @Get(':id')
  @Permissions('salesperson:read')
  @ApiOperation({ summary: 'Obtenir un vendeur par ID' })
  @ApiResponse({ status: 200, description: 'Vendeur trouvé' })
  @ApiResponse({ status: 404, description: 'Vendeur non trouvé' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salespersonsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('salesperson:write')
  @ApiOperation({ summary: 'Modifier un vendeur' })
  @ApiResponse({ status: 200, description: 'Vendeur modifié avec succès' })
  @ApiResponse({ status: 404, description: 'Vendeur non trouvé' })
  @ApiResponse({ status: 409, description: 'Conflit (login ou code déjà utilisé)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSalespersonDto: UpdateSalespersonDto,
    @CurrentUser() user: any,
  ) {
    return await this.salespersonsService.update(id, updateSalespersonDto, user.id);
  }

  @Delete(':id')
  @Permissions('salesperson:delete')
  @ApiOperation({ summary: 'Supprimer un vendeur' })
  @ApiResponse({ status: 200, description: 'Vendeur supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Vendeur non trouvé' })
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return await this.salespersonsService.remove(id, user.id);
  }
}

