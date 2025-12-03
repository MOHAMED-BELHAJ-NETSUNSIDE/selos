import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post()
  @Permissions('clients:write')
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  async create(@Body() createClientDto: CreateClientDto, @CurrentUser() user: any) {
    const client = await this.clientsService.create(createClientDto, user.id);
    
    // Émettre un événement de log
    this.eventEmitter.emit('log.created', {
      userId: user.id,
      module: 'clients',
      action: 'create',
      recordId: String(client.id),
      description: `Client ${client.code} (${client.nom}) créé`,
      newData: client,
    });
    
    return client;
  }

  @Get()
  @Permissions('clients:read')
  @ApiOperation({ summary: 'Get all clients with pagination and search' })
  @ApiResponse({ status: 200, description: 'Clients retrieved successfully' })
  findAll(@Query() query: QueryClientDto) {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @Permissions('clients:read')
  @ApiOperation({ summary: 'Get a client by id' })
  @ApiResponse({ status: 200, description: 'Client retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(Number(id));
  }

  @Get(':id/statistics')
  @Permissions('clients:read')
  @ApiOperation({ summary: 'Get client statistics (revenue, best product)' })
  @ApiResponse({ status: 200, description: 'Client statistics retrieved successfully' })
  async getClientStatistics(@Param('id') id: string) {
    return this.clientsService.getClientStatistics(Number(id));
  }

  @Patch(':id')
  @Permissions('clients:write')
  @ApiOperation({ summary: 'Update a client' })
  @ApiResponse({ status: 200, description: 'Client updated successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto, @CurrentUser() user: any) {
    const numericId = Number(id);
    const oldClient = await this.clientsService.findOne(numericId);
    const client = await this.clientsService.update(numericId, updateClientDto, user.id);
    
    // Déterminer quels champs ont été modifiés
    const changedFields: string[] = [];
    if (updateClientDto.code !== undefined && updateClientDto.code !== oldClient.code) changedFields.push('code');
    if (updateClientDto.nom !== undefined && updateClientDto.nom !== oldClient.nom) changedFields.push('nom');
    if (updateClientDto.canalId !== undefined && updateClientDto.canalId !== (oldClient.canal?.id)) changedFields.push('canalId');
    if (updateClientDto.localiteId !== undefined && updateClientDto.localiteId !== (oldClient.localite?.id)) changedFields.push('localiteId');
    
    // Émettre un événement de log
    this.eventEmitter.emit('log.created', {
      userId: user.id,
      module: 'clients',
      action: 'update',
      recordId: String(client.id),
      description: changedFields.length > 0 ? `Champs modifiés: ${changedFields.join(', ')}` : 'Aucun champ modifié',
      oldData: oldClient,
      newData: client,
    });
    
    return client;
  }

  @Delete(':id')
  @Permissions('clients:delete')
  @ApiOperation({ summary: 'Delete a client' })
  @ApiResponse({ status: 200, description: 'Client deleted successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const numericId = Number(id);
    const oldClient = await this.clientsService.findOne(numericId);
    await this.clientsService.remove(numericId, user.id);
    
    // Émettre un événement de log
    this.eventEmitter.emit('log.created', {
      userId: user.id,
      module: 'clients',
      action: 'delete',
      recordId: String(id),
      description: `Client ${oldClient.code} (${oldClient.nom}) supprimé`,
      oldData: oldClient,
    });
    
    return { message: 'Client supprimé avec succès' };
  }
}
