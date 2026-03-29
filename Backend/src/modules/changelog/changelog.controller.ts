// src/modules/changelog/changelog.controller.ts
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChangelogService } from './changelog.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('Changelog')
@Controller('changelog')
export class ChangelogController {
  constructor(private readonly changelogService: ChangelogService) {}

  @Get()
  findAll() {
    return this.changelogService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  create(@Body() body: { titulo: string; descripcion: string; version?: string; tag: string; destinatarios: string }) {
    return this.changelogService.create(body);
  }
}