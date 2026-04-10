import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('v1/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Post()
  saveSettings(@Body() data: Record<string, string>) {
    return this.settingsService.saveSettings(data);
  }

  @Get('company')
  getCompanyProfile() {
    return this.settingsService.getCompanyProfile();
  }

  @Patch('company')
  updateCompanyProfile(@Body() body: any) {
    return this.settingsService.updateCompanyProfile(body);
  }

  @Post('reset-data')
  resetAllData() {
    return this.settingsService.resetAllData();
  }
}
