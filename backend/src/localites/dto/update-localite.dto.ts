import { PartialType } from '@nestjs/swagger';
import { CreateLocaliteDto } from './create-localite.dto';

export class UpdateLocaliteDto extends PartialType(CreateLocaliteDto) {}


