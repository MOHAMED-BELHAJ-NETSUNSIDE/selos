import { Controller, Get, UseGuards, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { TypeClientsService } from './type-clients.service';
import { CreateTypeClientDto } from './dto/create-type-client.dto';
import { UpdateTypeClientDto } from './dto/update-type-client.dto';

@ApiTags('Type Clients')
@Controller('type-clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class TypeClientsController {
  constructor(private readonly typeClientsService: TypeClientsService) {}

  @Get()
  @Permissions('clients:read')
  @ApiOperation({ summary: 'Get all type clients' })
  @ApiResponse({ status: 200, description: 'Type clients retrieved successfully' })
  findAll() {
    return this.typeClientsService.findAll();
  }

  @Get(':id')
  @Permissions('clients:read')
  @ApiOperation({ summary: 'Get a type client by id' })
  findOne(@Param('id') id: string) {
    return this.typeClientsService.findOne(Number(id));
  }

  @Post()
  @Permissions('clients:write')
  @ApiOperation({ summary: 'Create a type client' })
  create(@Body() dto: CreateTypeClientDto) {
    return this.typeClientsService.create(dto);
  }

  @Patch(':id')
  @Permissions('clients:write')
  @ApiOperation({ summary: 'Update a type client' })
  update(@Param('id') id: string, @Body() dto: UpdateTypeClientDto) {
    return this.typeClientsService.update(Number(id), dto);
  }

  @Delete(':id')
  @Permissions('clients:delete')
  @ApiOperation({ summary: 'Delete a type client' })
  remove(@Param('id') id: string) {
    return this.typeClientsService.remove(Number(id));
  }
}


