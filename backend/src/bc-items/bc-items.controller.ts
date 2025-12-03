import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { BCItemsService } from './bc-items.service';
import { GetItemsDto } from './dto/get-items.dto';
import { BCItem } from './dto/bc-item.dto';

@ApiTags('BC Items')
@Controller('bc-items')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class BCItemsController {
  constructor(private readonly bcItemsService: BCItemsService) {}

  @Get()
  @Permissions('client:read')
  @ApiOperation({ summary: 'Get all BC items' })
  findAll(@Query() query: GetItemsDto) {
    return this.bcItemsService.findAll(query);
  }

  @Get(':id')
  @Permissions('client:read')
  @ApiOperation({ summary: 'Get BC item by id' })
  findOne(@Param('id') id: string) {
    return this.bcItemsService.findOne(Number(id));
  }

  @Post('sync')
  @Permissions('client:write')
  @ApiOperation({ summary: 'Sync items from Business Central' })
  syncItems(@Body() body: { items: BCItem[] }) {
    return this.bcItemsService.syncItems(body.items);
  }

  @Post('update-missing-units')
  @Permissions('client:write')
  @ApiOperation({ summary: 'Update missing baseUnitOfMeasure from rawJson for existing items' })
  updateMissingBaseUnitOfMeasure() {
    return this.bcItemsService.updateMissingBaseUnitOfMeasure();
  }
}

