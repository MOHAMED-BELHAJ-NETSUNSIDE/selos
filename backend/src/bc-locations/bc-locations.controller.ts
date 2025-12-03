import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { BCLocationsService } from './bc-locations.service';
import { GetLocationsDto } from './dto/get-locations.dto';
import { BCLocation } from './dto/bc-location.dto';

@ApiTags('BC Locations')
@Controller('bc-locations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class BCLocationsController {
  constructor(private readonly bcLocationsService: BCLocationsService) {}

  @Get()
  @Permissions('location:read')
  @ApiOperation({ summary: 'Get all BC locations' })
  findAll(@Query() query: GetLocationsDto) {
    return this.bcLocationsService.findAll(query);
  }

  @Get(':id')
  @Permissions('location:read')
  @ApiOperation({ summary: 'Get BC location by id' })
  findOne(@Param('id') id: string) {
    return this.bcLocationsService.findOne(Number(id));
  }

  @Post('sync')
  @Permissions('location:write')
  @ApiOperation({ summary: 'Sync locations from Business Central' })
  syncLocations(@Body() body: { locations: BCLocation[] }) {
    return this.bcLocationsService.syncLocations(body.locations);
  }
}

