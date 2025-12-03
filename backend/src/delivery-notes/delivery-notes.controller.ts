import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryNotesService } from './delivery-notes.service';
import { CreateDeliveryNoteDto } from './dto/create-delivery-note.dto';
import { UpdateDeliveryNoteDto } from './dto/update-delivery-note.dto';
import { QueryDeliveryNoteDto } from './dto/query-delivery-note.dto';
import { ValidateDeliveryNoteDto } from './dto/validate-delivery-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Delivery Notes')
@Controller('delivery-notes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class DeliveryNotesController {
  constructor(private readonly deliveryNotesService: DeliveryNotesService) {}

  @Post()
  @Permissions('delivery-note:write')
  @ApiOperation({ summary: 'Create a new delivery note' })
  @ApiResponse({ status: 201, description: 'Delivery note created successfully' })
  async create(@Body() createDeliveryNoteDto: CreateDeliveryNoteDto, @CurrentUser() user: any) {
    return this.deliveryNotesService.create(createDeliveryNoteDto, user.id);
  }

  @Get()
  @Permissions('delivery-note:read')
  @ApiOperation({ summary: 'Get all delivery notes with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Delivery notes retrieved successfully' })
  findAll(@Query() query: QueryDeliveryNoteDto) {
    return this.deliveryNotesService.findAll(query);
  }

  @Get(':id')
  @Permissions('delivery-note:read')
  @ApiOperation({ summary: 'Get a delivery note by id' })
  @ApiResponse({ status: 200, description: 'Delivery note retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Delivery note not found' })
  findOne(@Param('id') id: string) {
    return this.deliveryNotesService.findOne(Number(id));
  }

  @Patch(':id')
  @Permissions('delivery-note:write')
  @ApiOperation({ summary: 'Update a delivery note' })
  @ApiResponse({ status: 200, description: 'Delivery note updated successfully' })
  @ApiResponse({ status: 404, description: 'Delivery note not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDeliveryNoteDto: UpdateDeliveryNoteDto,
    @CurrentUser() user: any,
  ) {
    return this.deliveryNotesService.update(Number(id), updateDeliveryNoteDto, user.id);
  }

  @Post(':id/validate')
  @Permissions('delivery-note:write')
  @ApiOperation({ summary: 'Validate a delivery note and decrement stock' })
  @ApiResponse({ status: 200, description: 'Delivery note validated successfully and stock decremented' })
  @ApiResponse({ status: 400, description: 'Delivery note cannot be validated' })
  async validate(
    @Param('id') id: string,
    @Body() validateDto: ValidateDeliveryNoteDto,
    @CurrentUser() user: any,
  ) {
    return this.deliveryNotesService.validate(Number(id), validateDto, user.id);
  }

  @Post('calculate-price')
  @Permissions('delivery-note:read')
  @ApiOperation({ summary: 'Calculate product price for a client' })
  @ApiResponse({ status: 200, description: 'Price calculated successfully' })
  async calculatePrice(
    @Body() body: { productId: number; clientId: number; quantity?: number },
  ) {
    const prixUnitaire = await this.deliveryNotesService.getProductPriceForClient(
      body.productId,
      body.clientId,
      body.quantity || 1,
    );
    return { prixUnitaire };
  }

  @Delete(':id')
  @Permissions('delivery-note:delete')
  @ApiOperation({ summary: 'Delete a delivery note' })
  @ApiResponse({ status: 200, description: 'Delivery note deleted successfully' })
  @ApiResponse({ status: 404, description: 'Delivery note not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.deliveryNotesService.remove(Number(id), user.id);
  }
}

