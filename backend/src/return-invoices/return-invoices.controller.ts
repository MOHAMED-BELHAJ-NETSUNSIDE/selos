import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReturnInvoicesService } from './return-invoices.service';
import { QueryReturnInvoiceDto } from './dto/query-return-invoice.dto';
import { CreateReturnInvoiceDto } from './dto/create-return-invoice.dto';
import { ValidateReturnInvoiceDto } from './dto/validate-return-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Return Invoices')
@Controller('return-invoices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ReturnInvoicesController {
  constructor(private readonly returnInvoicesService: ReturnInvoicesService) {}

  @Get()
  @Permissions('return-invoice:read')
  @ApiOperation({ summary: 'Get all return invoices with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Return invoices retrieved successfully' })
  findAll(@Query() query: QueryReturnInvoiceDto) {
    return this.returnInvoicesService.findAll(query);
  }

  @Get(':id')
  @Permissions('return-invoice:read')
  @ApiOperation({ summary: 'Get a return invoice by id' })
  @ApiResponse({ status: 200, description: 'Return invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Return invoice not found' })
  findOne(@Param('id') id: string) {
    return this.returnInvoicesService.findOne(Number(id));
  }

  @Post()
  @Permissions('return-invoice:write')
  @ApiOperation({ summary: 'Create a return invoice from a purchase order' })
  @ApiResponse({ status: 201, description: 'Return invoice created successfully' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  @ApiResponse({ status: 409, description: 'Return invoice already exists for this purchase order' })
  create(@Body() createDto: CreateReturnInvoiceDto) {
    return this.returnInvoicesService.create(createDto);
  }

  @Patch(':id/validate')
  @Permissions('return-invoice:write')
  @ApiOperation({ summary: 'Validate a return invoice and update stock' })
  @ApiResponse({ status: 200, description: 'Return invoice validated successfully and stock updated' })
  @ApiResponse({ status: 404, description: 'Return invoice not found' })
  @ApiResponse({ status: 400, description: 'Return invoice cannot be validated' })
  validate(@Param('id') id: string, @Body() validateDto: ValidateReturnInvoiceDto, @CurrentUser() user: any) {
    return this.returnInvoicesService.validate(Number(id), user.id);
  }

  @Delete(':id')
  @Permissions('return-invoice:write')
  @ApiOperation({ summary: 'Delete a return invoice (only if status is "cree")' })
  @ApiResponse({ status: 200, description: 'Return invoice deleted successfully' })
  @ApiResponse({ status: 404, description: 'Return invoice not found' })
  @ApiResponse({ status: 403, description: 'Return invoice cannot be deleted (status is not "cree")' })
  remove(@Param('id') id: string) {
    return this.returnInvoicesService.remove(Number(id));
  }
}

