import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { RequireAdminLevel } from '../auth/admin-level.decorator';
import { FlavorLabService } from './flavor-lab.service';
import { UpsertBotanicalDto } from './dto/upsert-botanical.dto';
import { UpsertProjectDto } from './dto/upsert-project.dto';
import { AnalyzeProjectDto } from './dto/analyze-project.dto';

@Controller('flavor-lab')
export class FlavorLabController {
  constructor(private readonly flavorLab: FlavorLabService) {}

  @Get('botanicals')
  listBotanicals() {
    return this.flavorLab.listBotanicals();
  }

  @Get('projects')
  listProjects() {
    return this.flavorLab.listProjects();
  }

  @Get('projects/:id')
  getProject(@Param('id') id: string) {
    return this.flavorLab.getProject(id);
  }

  // Each call costs a real LLM API request — throttle tighter than the
  // global baseline, same reasoning as ai-cocktail's /generate endpoint.
  @Post('projects/:id/analyze')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async analyze(@Param('id') id: string, @Body() dto: AnalyzeProjectDto) {
    try {
      return await this.flavorLab.analyze(id, dto.locale ?? 'ko');
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new ServiceUnavailableException('Flavor DNA analysis failed.');
    }
  }

  @Put('admin/botanicals/:slug')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  upsertBotanical(@Param('slug') slug: string, @Body() dto: UpsertBotanicalDto) {
    return this.flavorLab.upsertBotanical(slug, dto);
  }

  @Delete('admin/botanicals/:slug')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  removeBotanical(@Param('slug') slug: string) {
    return this.flavorLab.removeBotanical(slug);
  }

  @Post('admin/projects')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  createProject(@Body() dto: UpsertProjectDto) {
    return this.flavorLab.createProject(dto);
  }

  @Put('admin/projects/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  updateProject(@Param('id') id: string, @Body() dto: UpsertProjectDto) {
    return this.flavorLab.updateProject(id, dto);
  }

  @Delete('admin/projects/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @RequireAdminLevel(2)
  removeProject(@Param('id') id: string) {
    return this.flavorLab.removeProject(id);
  }
}
