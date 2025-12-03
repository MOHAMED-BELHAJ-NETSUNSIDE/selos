import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { GouvernoratsService } from './gouvernorats.service';
import { CreateGouvernoratDto } from './dto/create-gouvernorat.dto';
import { UpdateGouvernoratDto } from './dto/update-gouvernorat.dto';

@ApiTags('Gouvernorats')
@Controller('gouvernorats')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class GouvernoratsController {
  constructor(private readonly gouvernoratsService: GouvernoratsService) {}

  @Get()
  @Permissions('gouvernorat:read')
  @ApiOperation({ summary: 'List gouvernorats' })
  findAll() { return this.gouvernoratsService.findAll(); }

  @Get(':id')
  @Permissions('gouvernorat:read')
  @ApiOperation({ summary: 'Get gouvernorat by id' })
  findOne(@Param('id') id: string) { return this.gouvernoratsService.findOne(Number(id)); }

  @Post()
  @Permissions('gouvernorat:write')
  @ApiOperation({ summary: 'Create gouvernorat' })
  create(@Body() dto: CreateGouvernoratDto) { return this.gouvernoratsService.create(dto); }

  @Patch(':id')
  @Permissions('gouvernorat:write')
  @ApiOperation({ summary: 'Update gouvernorat' })
  update(@Param('id') id: string, @Body() dto: UpdateGouvernoratDto) { return this.gouvernoratsService.update(Number(id), dto); }

  @Delete(':id')
  @Permissions('gouvernorat:delete')
  @ApiOperation({ summary: 'Delete gouvernorat' })
  remove(@Param('id') id: string) { return this.gouvernoratsService.remove(Number(id)); }
}


