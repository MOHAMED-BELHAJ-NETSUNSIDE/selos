import { PartialType } from '@nestjs/swagger';
import { CreateSousRegionDto } from './create-sous-region.dto';

export class UpdateSousRegionDto extends PartialType(CreateSousRegionDto) {}


