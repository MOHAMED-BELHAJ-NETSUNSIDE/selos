import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { QueryPurchaseOrderDto } from './dto/query-purchase-order.dto';
import { ValidatePurchaseOrderDto } from './dto/validate-purchase-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Purchase Orders')
@Controller('purchase-orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PurchaseOrdersController {
  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post()
  @Permissions('purchase-order:write')
  @ApiOperation({ summary: 'Create a new purchase order' })
  @ApiResponse({ status: 201, description: 'Purchase order created successfully' })
  async create(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto, @CurrentUser() user: any) {
    return this.purchaseOrdersService.create(createPurchaseOrderDto, user.id);
  }

  @Post('from-chargement-type/:chargementTypeId')
  @Permissions('purchase-order:write')
  @ApiOperation({ summary: 'Create a purchase order from a chargement type' })
  @ApiResponse({ status: 201, description: 'Purchase order created successfully from chargement type' })
  async createFromChargementType(
    @Param('chargementTypeId') chargementTypeId: string,
    @Body() body: { locationId?: string | null },
    @CurrentUser() user: any,
  ) {
    return this.purchaseOrdersService.createFromChargementType(Number(chargementTypeId), user.id, body.locationId);
  }

  @Get()
  @Permissions('purchase-order:read')
  @ApiOperation({ summary: 'Get all purchase orders with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Purchase orders retrieved successfully' })
  findAll(@Query() query: QueryPurchaseOrderDto) {
    return this.purchaseOrdersService.findAll(query);
  }

  @Get('products/available')
  @Permissions('purchase-order:read')
  @ApiOperation({ summary: 'Get all available products for purchase orders' })
  @ApiResponse({ status: 200, description: 'Available products retrieved successfully' })
  getAvailableProducts() {
    return this.purchaseOrdersService.getAvailableProducts();
  }

  @Get(':id')
  @Permissions('purchase-order:read')
  @ApiOperation({ summary: 'Get a purchase order by id' })
  @ApiResponse({ status: 200, description: 'Purchase order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  findOne(@Param('id') id: string) {
    return this.purchaseOrdersService.findOne(Number(id));
  }

  @Patch(':id')
  @Permissions('purchase-order:write')
  @ApiOperation({ summary: 'Update a purchase order' })
  @ApiResponse({ status: 200, description: 'Purchase order updated successfully' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.purchaseOrdersService.update(Number(id), updatePurchaseOrderDto, user.id);
  }

  @Post(':id/validate')
  @Permissions('purchase-order:write')
  @ApiOperation({ summary: 'Validate a purchase order (send to BC, update stock, create invoice)' })
  @ApiResponse({ status: 200, description: 'Purchase order validated successfully' })
  @ApiResponse({ status: 400, description: 'Purchase order cannot be validated' })
  async validate(
    @Param('id') id: string,
    @Body() validateDto: ValidatePurchaseOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.purchaseOrdersService.validate(Number(id), validateDto, user.id);
  }

  @Post(':id/mark-as-expedie')
  @Permissions('purchase-order:write')
  @ApiOperation({ summary: 'Mark purchase order as expedie and update stock' })
  @ApiResponse({ status: 200, description: 'Purchase order marked as expedie and stock updated' })
  @ApiResponse({ status: 400, description: 'Purchase order cannot be marked as expedie' })
  async markAsExpedie(@Param('id') id: string, @CurrentUser() user: any) {
    return this.purchaseOrdersService.markAsExpedie(Number(id), user.id);
  }

  @Get(':id/bc-status')
  @Permissions('purchase-order:read')
  @ApiOperation({ summary: 'Récupère et met à jour le statut BC du bon de commande' })
  @ApiResponse({ status: 200, description: 'Statut BC récupéré avec succès' })
  @ApiResponse({ status: 400, description: 'Erreur lors de la récupération du statut BC' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async refreshBCStatus(@Param('id') id: string) {
    return this.purchaseOrdersService.refreshBCStatus(Number(id));
  }

  @Post(':id/cancel')
  @Permissions('purchase-order:write')
  @ApiOperation({ summary: 'Cancel a purchase order' })
  @ApiResponse({ status: 200, description: 'Purchase order cancelled successfully' })
  async cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.purchaseOrdersService.cancel(Number(id), user.id);
  }

  @Delete(':id')
  @Permissions('purchase-order:delete')
  @ApiOperation({ summary: 'Delete a purchase order' })
  @ApiResponse({ status: 200, description: 'Purchase order deleted successfully' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.purchaseOrdersService.remove(Number(id), user.id);
  }
}

