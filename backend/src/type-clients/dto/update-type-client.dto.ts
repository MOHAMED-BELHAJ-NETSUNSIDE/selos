import { PartialType } from '@nestjs/swagger';
import { CreateTypeClientDto } from './create-type-client.dto';

export class UpdateTypeClientDto extends PartialType(CreateTypeClientDto) {}


