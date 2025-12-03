import { IsString, IsOptional, IsNumber, MinLength, IsEmail, ValidateIf, IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSalespersonDto {
  @ApiProperty({ example: 'John', required: false, description: 'Prénom du vendeur (récupéré automatiquement depuis BC si non fourni)' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false, description: 'Nom du vendeur (récupéré automatiquement depuis BC si non fourni)' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'john.doe@example.com', required: false, description: 'Email du vendeur' })
  @IsOptional()
  @IsEmail()
  email?: string;


  @ApiProperty({ example: '+216 12 345 678', required: false, description: 'Téléphone (récupéré automatiquement depuis BC si non fourni)' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiProperty({ example: '123 Rue Example, Tunis', required: false })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiProperty({ example: '2024-01-15', required: false, description: 'Date d\'embauche' })
  @IsOptional()
  @Type(() => Date)
  dateEmbauche?: Date;

  @ApiProperty({ example: 'actif', required: false, default: 'actif' })
  @IsOptional()
  @IsString()
  statut?: string;

  @ApiProperty({ example: 'john.doe', description: 'Login pour Selos Retails' })
  @IsString()
  @MinLength(3)
  login: string;

  @ApiProperty({ example: 'password123', minLength: 6, description: 'Mot de passe pour Selos Retails' })
  @IsString()
  @MinLength(6)
  password: string;

  // Informations du dépôt
  @ApiProperty({ example: '123 Rue Example, Tunis', required: false })
  @IsOptional()
  @IsString()
  depotAdresse?: string;

  @ApiProperty({ example: '+216 12 345 678', required: false })
  @IsOptional()
  @IsString()
  depotTel?: string;

  @ApiProperty({ example: 1, required: false, default: 1, description: '1 = actif, 0 = inactif' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  depotStatus?: number;

  @ApiProperty({ example: 'Remarques sur le dépôt', required: false })
  @IsOptional()
  @IsString()
  depotRemarque?: string;

  @ApiProperty({ example: 'bc-customer-id-123', description: 'ID du client Business Central à associer (obligatoire)' })
  @IsString()
  bcCustomerId: string;

  @ApiProperty({ example: '74331f6f-bd37-f011-9a4a-000d3a898d22', required: false, description: 'BC Location bcId (GUID)', nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.bcLocationId !== null)
  @IsString()
  bcLocationId?: string | null;

  @ApiProperty({ example: [1, 2, 3], required: false, description: 'IDs des canaux (tableau)', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  canalIds?: number[];

  @ApiProperty({ example: [1, 2], required: false, description: 'IDs des types de vente (tableau)', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  typeVenteIds?: number[];

  @ApiProperty({ example: 1, description: 'ID du secteur (obligatoire)', type: Number, required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  secteurId?: number;
}

