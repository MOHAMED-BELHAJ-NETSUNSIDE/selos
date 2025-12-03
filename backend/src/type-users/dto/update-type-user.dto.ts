import { PartialType } from '@nestjs/swagger';
import { CreateTypeUserDto } from './create-type-user.dto';

export class UpdateTypeUserDto extends PartialType(CreateTypeUserDto) {}


