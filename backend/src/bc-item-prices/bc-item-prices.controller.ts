import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { BCItemPricesService } from './bc-item-prices.service';
import { GetPricesDto } from './dto/get-prices.dto';
import { BCItemPrice } from './dto/bc-item-price.dto';

@ApiTags('BC Item Prices')
@Controller('bc-item-prices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class BCItemPricesController {
  constructor(private readonly bcItemPricesService: BCItemPricesService) {}

  @Get()
  @Permissions('client:read')
  @ApiOperation({ summary: 'Get all BC item prices' })
  findAll(@Query() query: GetPricesDto) {
    return this.bcItemPricesService.findAll(query);
  }

  @Get(':id')
  @Permissions('client:read')
  @ApiOperation({ summary: 'Get BC item price by id' })
  findOne(@Param('id') id: string) {
    return this.bcItemPricesService.findOne(Number(id));
  }

  @Get('item/:itemId')
  @Permissions('client:read')
  @ApiOperation({ summary: 'Get all prices for a specific item by itemId' })
  findByItemId(@Param('itemId') itemId: string) {
    return this.bcItemPricesService.findByItemId(itemId);
  }

  @Get('item-number/:itemNumber')
  @Permissions('client:read')
  @ApiOperation({ summary: 'Get all prices for a specific item by item number' })
  findByItemNumber(@Param('itemNumber') itemNumber: string) {
    return this.bcItemPricesService.findByItemNumber(itemNumber);
  }

  @Get('bc-item/:bcItemId')
  @Permissions('client:read')
  @ApiOperation({ summary: 'Get all prices for a specific BC item by bcId' })
  findByBcItemId(@Param('bcItemId') bcItemId: string) {
    return this.bcItemPricesService.findByBcItemId(bcItemId);
  }

  @Post('sync')
  @Permissions('client:write')
  @ApiOperation({ summary: 'Sync prices from Business Central' })
  syncPrices(@Body() body: { prices: BCItemPrice[] }) {
    return this.bcItemPricesService.syncPrices(body.prices);
  }
}

