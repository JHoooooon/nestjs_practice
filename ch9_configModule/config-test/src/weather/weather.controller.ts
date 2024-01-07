import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('weather')
export class WeatherController {
  constructor(private readonly configService: ConfigService) {}

  private callWheatherApi(apiUrl: string, apiKey: string) {
    console.log('날씨를 가져오는 중...');
    console.log(apiUrl);
    console.log(apiKey);
    return '내일은 맑음';
  }

  @Get()
  public getWeather(): string {
    const apiUrl = this.configService.get('WEATHER_API_URL');
    const apiKey = this.configService.get('WEATHER_API_KEY');
    return this.callWheatherApi(apiUrl, apiKey);
  }
}
