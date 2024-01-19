import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  // app 에서 ExpressAplication 에 대한 타입을 제네릭으로 지정한다.
  // 지정하지 않을시 app 에서 타입을 찾지 못한다.
  // 현재 여기에선 useStatecAssets 을 사용하므로,
  // 해당 타입을 쉽게 찾기 위해 제네릭으로 명확하게 타입지정해준다
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // express 자체에서 제공하는 staticAssets 를 사용할수도 있다.
  // 이는 정적 폴더를 간단하게 설정한다.
  // server-static 은 복잡한 구현시 사용하기 좋다
  app.useStaticAssets(join(__dirname, '..', 'static'));

  await app.listen(3000);
}
bootstrap();
