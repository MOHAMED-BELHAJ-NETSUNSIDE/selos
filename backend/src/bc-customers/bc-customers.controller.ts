import { Controller, Get, Post, Body, Query, Param, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { BCCustomersService } from './bc-customers.service';
import { GetCustomersDto } from './dto/get-customers.dto';
import { BCCustomer } from './dto/bc-customer.dto';
import { UpdateLocalFieldsDto } from './dto/update-local-fields.dto';

@ApiTags('BC Customers')
@Controller('bc-customers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class BCCustomersController {
  constructor(private readonly bcCustomersService: BCCustomersService) {}

  @Get()
  @Permissions('client:read')
  @ApiOperation({ summary: 'Get all BC customers' })
  findAll(@Query() query: GetCustomersDto) {
    return this.bcCustomersService.findAll(query);
  }

  @Get(':id')
  @Permissions('client:read')
  @ApiOperation({ summary: 'Get BC customer by id' })
  findOne(@Param('id') id: string) {
    return this.bcCustomersService.findOne(Number(id));
  }

  @Post('sync')
  @Permissions('client:write')
  @ApiOperation({ summary: 'Sync customers from Business Central' })
  syncCustomers(@Body() body: { customers: BCCustomer[] }) {
    return this.bcCustomersService.syncCustomers(body.customers);
  }

  @Patch(':id/local')
  @Permissions('client:write')
  @ApiOperation({ summary: 'Update local fields (canal, type vente) for BC customer' })
  updateLocalFields(
    @Param('id') id: string,
    @Body() updateLocalFieldsDto: UpdateLocalFieldsDto,
  ) {
    return this.bcCustomersService.updateLocalFields(Number(id), updateLocalFieldsDto);
  }
}

