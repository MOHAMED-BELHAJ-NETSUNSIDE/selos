import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PurchaseInvoicesService } from './purchase-invoices.service';
import { QueryPurchaseInvoiceDto } from './dto/query-purchase-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Purchase Invoices')
@Controller('purchase-invoices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PurchaseInvoicesController {
  constructor(private readonly purchaseInvoicesService: PurchaseInvoicesService) {}

  @Get()
  @Permissions('purchase-invoice:read')
  @ApiOperation({ summary: 'Get all purchase invoices with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Purchase invoices retrieved successfully' })
  findAll(@Query() query: QueryPurchaseInvoiceDto) {
    return this.purchaseInvoicesService.findAll(query);
  }

  @Get(':id')
  @Permissions('purchase-invoice:read')
  @ApiOperation({ summary: 'Get a purchase invoice by id' })
  @ApiResponse({ status: 200, description: 'Purchase invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Purchase invoice not found' })
  findOne(@Param('id') id: string) {
    return this.purchaseInvoicesService.findOne(Number(id));
  }
}

