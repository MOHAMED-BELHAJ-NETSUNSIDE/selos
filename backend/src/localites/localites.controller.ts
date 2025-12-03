import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { LocalitesService } from './localites.service';
import { CreateLocaliteDto } from './dto/create-localite.dto';
import { UpdateLocaliteDto } from './dto/update-localite.dto';
import { QueryLocalitesDto } from './dto/query-localites.dto';

@ApiTags('Localités')
@Controller('localites')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class LocalitesController {
  constructor(private readonly localitesService: LocalitesService) {}

  @Get()
  @Permissions('localite:read')
  @ApiOperation({ summary: 'List localités with pagination' })
  findAll(@Query() query: QueryLocalitesDto) { return this.localitesService.findAll(query); }

  @Get(':id')
  @Permissions('localite:read')
  @ApiOperation({ summary: 'Get localité by id' })
  findOne(@Param('id') id: string) { return this.localitesService.findOne(Number(id)); }

  @Post()
  @Permissions('localite:write')
  @ApiOperation({ summary: 'Create localité' })
  create(@Body() dto: CreateLocaliteDto) { return this.localitesService.create(dto); }

  @Patch(':id')
  @Permissions('localite:write')
  @ApiOperation({ summary: 'Update localité' })
  update(@Param('id') id: string, @Body() dto: UpdateLocaliteDto) { return this.localitesService.update(Number(id), dto); }

  @Delete(':id')
  @Permissions('localite:delete')
  @ApiOperation({ summary: 'Delete localité' })
  remove(@Param('id') id: string) { return this.localitesService.remove(Number(id)); }
}


