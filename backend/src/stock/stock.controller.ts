import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StockService } from './stock.service';
import { GetStockConsultationDto } from './dto/get-stock-consultation.dto';
import { StockConsultationResponseDto } from './dto/stock-consultation-response.dto';
import { GetStockTransactionsDto } from './dto/get-stock-transactions.dto';
import { StockTransactionsResponseDto } from './dto/stock-transactions-response.dto';
import { GetStockByLocationDto } from './dto/get-stock-by-location.dto';

@ApiTags('Stock')
@Controller('stock')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('consultation')
  @Permissions('stock:read')
  @ApiOperation({ summary: 'Consultation du stock' })
  async getStockConsultation(
    @Query() query: GetStockConsultationDto,
    @CurrentUser() user: any,
  ): Promise<StockConsultationResponseDto> {
    // Extraire salespersonId du payload JWT si présent
    // Le payload peut contenir salespersonId directement ou dans salesperson.id
    let currentUser = user;
    
    // Si le user a un salesperson dans le payload JWT (pour Selos Retails)
    if (user?.salesperson) {
      currentUser = { salesperson: { id: user.salesperson.id } };
    } else if (user?.salespersonId) {
      // Si salespersonId est directement dans le payload
      currentUser = { salesperson: { id: user.salespersonId } };
    }

    return this.stockService.getStockConsultation(query, currentUser);
  }

  @Get('transactions')
  @Permissions('stock:read')
  @ApiOperation({ summary: 'Récupérer les transactions de stock pour un produit et un vendeur' })
  async getStockTransactions(
    @Query() query: GetStockTransactionsDto,
    @CurrentUser() user: any,
  ): Promise<StockTransactionsResponseDto> {
    // Extraire salespersonId du payload JWT si présent (pour Selos Retails)
    // Si le user a un salesperson dans le payload JWT, utiliser son ID
    let salespersonId = query.salespersonId;
    
    if (user?.salesperson?.id) {
      // Pour Selos Retails, forcer l'utilisation du salespersonId du token
      salespersonId = user.salesperson.id;
    } else if (user?.salespersonId) {
      // Si salespersonId est directement dans le payload
      salespersonId = user.salespersonId;
    }

    // Créer un nouveau query avec le salespersonId extrait du token
    const queryWithUser = { ...query, salespersonId };
    
    return this.stockService.getStockTransactions(queryWithUser, user);
  }

  @Get('by-location')
  @Permissions('stock:read')
  @ApiOperation({ summary: 'Consultation du stock par magasin depuis Business Central' })
  async getStockByLocation(@Query() query: GetStockByLocationDto) {
    return this.stockService.getStockByLocation(query);
  }
}

