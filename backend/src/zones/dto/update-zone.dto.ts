import { PartialType, OmitType, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, ValidateIf, Validate, IsNotEmpty, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CreateZoneDto } from './create-zone.dto';

// Validateur personnalisé pour typeVenteIds
function IsTypeVenteIdsArray(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isTypeVenteIdsArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Si undefined ou null, c'est valide (optionnel)
          if (value === undefined || value === null) {
            return true;
          }
          // Doit être un tableau
          if (!Array.isArray(value)) {
            return false;
          }
          // Doit avoir au moins un élément
          if (value.length === 0) {
            return false;
          }
          // Chaque élément doit être un nombre
          return value.every((item) => typeof item === 'number' && !isNaN(item));
        },
        defaultMessage(args: ValidationArguments) {
          return 'typeVenteIds doit être un tableau non vide de nombres';
        },
      },
    });
  };
}

// Validateur personnalisé pour frequenceVisite (obligatoire)
function IsFrequenceVisite(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isFrequenceVisite',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Doit être défini et non vide
          if (value === undefined || value === null || value === '' || value === 'none') {
            return false;
          }
          // Doit être une chaîne de caractères
          if (typeof value !== 'string') {
            return false;
          }
          // Doit être une des valeurs autorisées
          return ['Par semaine', 'Par quinzaine', 'Par mois'].includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'La fréquence de visite est requise et doit être: Par semaine, Par quinzaine ou Par mois';
        },
      },
    });
  };
}

// Validateur personnalisé pour canalIds
function IsCanalIdsArray(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCanalIdsArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Si undefined ou null, c'est valide (optionnel)
          if (value === undefined || value === null) {
            return true;
          }
          // Doit être un tableau
          if (!Array.isArray(value)) {
            return false;
          }
          // Doit avoir au moins un élément
          if (value.length === 0) {
            return false;
          }
          // Chaque élément doit être un nombre
          return value.every((item) => typeof item === 'number' && !isNaN(item));
        },
        defaultMessage(args: ValidationArguments) {
          return 'canalIds doit être un tableau non vide de nombres';
        },
      },
    });
  };
}

// Validateur personnalisé pour localiteIds
function IsLocaliteIdsArray(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isLocaliteIdsArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Si undefined ou null, c'est valide (optionnel)
          if (value === undefined || value === null) {
            return true;
          }
          // Doit être un tableau
          if (!Array.isArray(value)) {
            return false;
          }
          // Peut être vide (optionnel)
          // Chaque élément doit être un nombre
          return value.every((item) => typeof item === 'number' && !isNaN(item));
        },
        defaultMessage(args: ValidationArguments) {
          return 'localiteIds doit être un tableau de nombres';
        },
      },
    });
  };
}

export class UpdateZoneDto extends PartialType(OmitType(CreateZoneDto, ['typeVenteIds', 'frequenceVisite', 'canalIds'] as const)) {
  @ApiProperty({ example: [1, 2], description: 'Canal ids', required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    if (Array.isArray(value)) {
      return value.map((item) => Number(item));
    }
    return value;
  })
  @IsCanalIdsArray({ message: 'canalIds doit être un tableau non vide de nombres' })
  canalIds?: number[];

  @ApiProperty({ example: [1, 2], description: 'Type de vente ids', required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    if (Array.isArray(value)) {
      return value.map((item) => Number(item));
    }
    return value;
  })
  @IsTypeVenteIdsArray({ message: 'typeVenteIds doit être un tableau non vide de nombres' })
  typeVenteIds?: number[];

  @ApiProperty({ example: [1, 2], description: 'Localité ids', required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    if (Array.isArray(value)) {
      return value.map((item) => Number(item));
    }
    return value;
  })
  @IsLocaliteIdsArray({ message: 'localiteIds doit être un tableau de nombres' })
  localiteIds?: number[];

  // frequenceVisite est exclu du PartialType et redéclaré comme obligatoire
  @ApiProperty({ example: 'Par semaine', description: 'Fréquence de visite', enum: ['Par semaine', 'Par quinzaine', 'Par mois'], required: true })
  @IsNotEmpty({ message: 'La fréquence de visite est requise' })
  @IsFrequenceVisite({ message: 'La fréquence de visite est requise et doit être: Par semaine, Par quinzaine ou Par mois' })
  frequenceVisite!: string;
}


