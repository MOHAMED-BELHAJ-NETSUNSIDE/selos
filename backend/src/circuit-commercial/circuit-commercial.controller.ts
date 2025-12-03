import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CircuitCommercialService } from './circuit-commercial.service';
import { UpdateCircuitCommercialDto } from './dto/update-circuit-commercial.dto';

@ApiTags('Circuit Commercial')
@Controller('secteurs/:secteurId/circuit-commercial')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class CircuitCommercialController {
  constructor(private readonly circuitCommercialService: CircuitCommercialService) {}

  @Get()
  @Permissions('secteur:read')
  @ApiOperation({ summary: 'Get circuit commercial by secteur' })
  getBySecteur(@Param('secteurId') secteurId: string) {
    return this.circuitCommercialService.getBySecteur(Number(secteurId));
  }

  @Put()
  @Permissions('secteur:write')
  @ApiOperation({ summary: 'Update circuit commercial' })
  update(@Param('secteurId') secteurId: string, @Body() dto: UpdateCircuitCommercialDto) {
    return this.circuitCommercialService.update(Number(secteurId), dto);
  }
}


