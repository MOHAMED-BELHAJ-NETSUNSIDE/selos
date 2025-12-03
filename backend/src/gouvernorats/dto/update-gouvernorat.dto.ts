import { PartialType } from '@nestjs/swagger';
import { CreateGouvernoratDto } from './create-gouvernorat.dto';

export class UpdateGouvernoratDto extends PartialType(CreateGouvernoratDto) {}


