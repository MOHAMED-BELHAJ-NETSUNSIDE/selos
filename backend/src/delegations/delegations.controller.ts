import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { DelegationsService } from './delegations.service';
import { CreateDelegationDto } from './dto/create-delegation.dto';
import { UpdateDelegationDto } from './dto/update-delegation.dto';

@ApiTags('Delegations')
@Controller('delegations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class DelegationsController {
  constructor(private readonly delegationsService: DelegationsService) {}

  @Get()
  @Permissions('delegation:read')
  findAll() { return this.delegationsService.findAll(); }

  @Get(':id')
  @Permissions('delegation:read')
  findOne(@Param('id') id: string) { return this.delegationsService.findOne(Number(id)); }

  @Post()
  @Permissions('delegation:write')
  create(@Body() dto: CreateDelegationDto) { return this.delegationsService.create(dto); }

  @Patch(':id')
  @Permissions('delegation:write')
  update(@Param('id') id: string, @Body() dto: UpdateDelegationDto) { return this.delegationsService.update(Number(id), dto); }

  @Delete(':id')
  @Permissions('delegation:delete')
  remove(@Param('id') id: string) { return this.delegationsService.remove(Number(id)); }
}


