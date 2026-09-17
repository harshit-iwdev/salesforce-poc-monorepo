import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('oauth/callback')
  handleOAuthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): void {
    const stateParam = state ? `&state=${encodeURIComponent(state)}` : '';
    res.redirect(`/salesforce/auth/callback?code=${encodeURIComponent(code || '')}${stateParam}`);
  }
}

