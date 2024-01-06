import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { WeatherModule } from './weather/weather.module';
import conf from 'envs/conf';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      // process.cwd() 가 `src` 가 아니라 `config-test` 를 가리킨다
      // 이는 현재 실행중인 프로세스의 현재 디렉토리를 가리킨다
      // 실행중인 프로세스 시점에서 실행되는 디렉토리는
      // package.json 을 가진 폴더이기에 `config-test` 를 가리킨다.
      envFilePath: `${process.cwd()}/envs/.env.${process.env.NODE_ENV}`,
      load: [conf],
    }),
    WeatherModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
