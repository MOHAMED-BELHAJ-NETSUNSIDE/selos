import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { QuerySaleDto } from './dto/query-sale.dto';
import { ValidateSaleDto } from './dto/validate-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Sales')
@Controller('sales')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('from-delivery-note/:deliveryNoteId')
  @Permissions('sale:write')
  @ApiOperation({ summary: 'Create a sale from a validated delivery note' })
  @ApiResponse({ status: 201, description: 'Sale created successfully from delivery note' })
  @ApiResponse({ status: 400, description: 'Delivery note cannot be used to create a sale' })
  async createFromDeliveryNote(
    @Param('deliveryNoteId') deliveryNoteId: string,
    @CurrentUser() user: any,
  ) {
    return this.salesService.createFromDeliveryNote(Number(deliveryNoteId), user.id);
  }

  @Post()
  @Permissions('sale:write')
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiResponse({ status: 201, description: 'Sale created successfully' })
  async create(@Body() createSaleDto: CreateSaleDto, @CurrentUser() user: any) {
    return this.salesService.create(createSaleDto, user.id);
  }

  @Get()
  @Permissions('sale:read')
  @ApiOperation({ summary: 'Get all sales with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Sales retrieved successfully' })
  findAll(@Query() query: QuerySaleDto) {
    return this.salesService.findAll(query);
  }

  @Get(':id')
  @Permissions('sale:read')
  @ApiOperation({ summary: 'Get a sale by id' })
  @ApiResponse({ status: 200, description: 'Sale retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(Number(id));
  }

  @Patch(':id')
  @Permissions('sale:write')
  @ApiOperation({ summary: 'Update a sale' })
  @ApiResponse({ status: 200, description: 'Sale updated successfully' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async update(
    @Param('id') id: string,
    @Body() updateSaleDto: UpdateSaleDto,
    @CurrentUser() user: any,
  ) {
    return this.salesService.update(Number(id), updateSaleDto, user.id);
  }

  @Post(':id/validate')
  @Permissions('sale:write')
  @ApiOperation({ summary: 'Validate a sale and decrement stock' })
  @ApiResponse({ status: 200, description: 'Sale validated successfully and stock decremented' })
  @ApiResponse({ status: 400, description: 'Sale cannot be validated' })
  async validate(
    @Param('id') id: string,
    @Body() validateDto: ValidateSaleDto,
    @CurrentUser() user: any,
  ) {
    return this.salesService.validate(Number(id), validateDto, user.id);
  }

  @Post('calculate-price')
  @Permissions('sale:read')
  @ApiOperation({ summary: 'Calculate product price for a client' })
  @ApiResponse({ status: 200, description: 'Price calculated successfully' })
  async calculatePrice(
    @Body() body: { productId: number; clientId: number; quantity?: number },
  ) {
    const prixUnitaire = await this.salesService.getProductPriceForClient(
      body.productId,
      body.clientId,
      body.quantity || 1,
    );
    return { prixUnitaire };
  }

  @Delete(':id')
  @Permissions('sale:delete')
  @ApiOperation({ summary: 'Delete a sale' })
  @ApiResponse({ status: 200, description: 'Sale deleted successfully' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.salesService.remove(Number(id), user.id);
  }
}

