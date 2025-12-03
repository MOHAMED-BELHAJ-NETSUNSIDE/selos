import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { ClientsModule } from './clients/clients.module';
import { LogsModule } from './logs/logs.module';
import { TypeUsersModule } from './type-users/type-users.module';
import { TypeClientsModule } from './type-clients/type-clients.module';
import { PermissionsModule } from './permissions/permissions.module';
import { SecteursModule } from './secteurs/secteurs.module';
import { CanalsModule } from './canals/canals.module';
import { TypeVentesModule } from './type-ventes/type-ventes.module';
import { ZonesModule } from './zones/zones.module';
import { SousRegionsModule } from './sous-regions/sous-regions.module';
import { RegionsModule } from './regions/regions.module';
import { GouvernoratsModule } from './gouvernorats/gouvernorats.module';
import { DelegationsModule } from './delegations/delegations.module';
import { LocalitesModule } from './localites/localites.module';
import { CircuitCommercialModule } from './circuit-commercial/circuit-commercial.module';
import { BCCustomersModule } from './bc-customers/bc-customers.module';
import { BCItemsModule } from './bc-items/bc-items.module';
import { BCItemPricesModule } from './bc-item-prices/bc-item-prices.module';
import { BCLocationsModule } from './bc-locations/bc-locations.module';
import { SalespersonsModule } from './salespersons/salespersons.module';
import { StockModule } from './stock/stock.module';
import { ChargementTypesModule } from './chargement-types/chargement-types.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { PurchaseInvoicesModule } from './purchase-invoices/purchase-invoices.module';
import { ReturnInvoicesModule } from './return-invoices/return-invoices.module';
import { DeliveryNotesModule } from './delivery-notes/delivery-notes.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'], // Charge .env.local en priorité, puis .env
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutes par défaut (en millisecondes)
      max: 100, // Nombre maximum d'éléments en cache
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    ClientsModule,
    LogsModule,
    TypeUsersModule,
    TypeClientsModule,
    PermissionsModule,
    SecteursModule,
    CanalsModule,
    TypeVentesModule,
    ZonesModule,
    SousRegionsModule,
    RegionsModule,
    GouvernoratsModule,
    DelegationsModule,
    LocalitesModule,
    CircuitCommercialModule,
    BCCustomersModule,
    BCItemsModule,
    BCItemPricesModule,
    BCLocationsModule,
    SalespersonsModule,
    StockModule,
    ChargementTypesModule,
    PurchaseOrdersModule,
    PurchaseInvoicesModule,
    ReturnInvoicesModule,
    DeliveryNotesModule,
    SalesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
