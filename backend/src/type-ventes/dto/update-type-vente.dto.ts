import { PartialType } from '@nestjs/swagger';
import { CreateTypeVenteDto } from './create-type-vente.dto';

export class UpdateTypeVenteDto extends PartialType(CreateTypeVenteDto) {}


