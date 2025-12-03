import { PartialType } from '@nestjs/swagger';
import { CreateChargementTypeDto } from './create-chargement-type.dto';

export class UpdateChargementTypeDto extends PartialType(CreateChargementTypeDto) {}

