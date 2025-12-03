import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { getPermissionCatalog } from './permissions.registry';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  @Get()
  @ApiOperation({ summary: 'Get permission catalog' })
  @ApiResponse({ status: 200 })
  findAll() {
    return getPermissionCatalog();
  }
}


