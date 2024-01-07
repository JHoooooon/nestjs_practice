import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly appService: AppService,
  ) {}

  @Get()
  getHello(): any {
    const msg = this.configService.get('MESSAGE');
    return { msg };
  }

  @Get('/service-url')
  getServiceUrl(): string {
    return this.configService.get('SERVICE_URL');
  }

  @Get('/db-info')
  getTest(): string {
    console.log(this.configService.get('logLevel')); // dev
    console.log(this.configService.get('apiVersion')); // 1.0.0
    return this.configService.get('dbInfo'); // http://dev-mysql:3306
  }

  @Get('/redis-info')
  getRedisInfo(): string {
    return `${this.configService.get('redis.host')}:${this.configService.get(
      'http.port',
    )}`;
  }
}
