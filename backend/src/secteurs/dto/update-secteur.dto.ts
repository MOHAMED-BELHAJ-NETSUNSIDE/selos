import { PartialType, ApiProperty, OmitType } from '@nestjs/swagger';
import { IsOptional, IsArray, IsNumber, ArrayMinSize } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CreateSecteurDto } from './create-secteur.dto';

export class UpdateSecteurDto extends PartialType(OmitType(CreateSecteurDto, ['canalIds'] as const)) {
  @ApiProperty({ example: [1, 2], description: 'Canal ids', required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    if (Array.isArray(value)) {
      return value.map((item) => Number(item));
    }
    return value;
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1, { message: 'Au moins un canal est requis' })
  canalIds?: number[];
}


