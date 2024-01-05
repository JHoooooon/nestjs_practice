import { NestFactory } from "@nestjs/core";
import { HelloModule } from "./hello.module";

// nestjs 의 실행시킬 최조 진입점인 bootstrap 함수를 생성한다.
async function bootstrap () {
  // Factory Pattern 을 구현한 NestFactory 를 사용하여
  // 새로운 Application 앱 인스턴스를 생성한다.
  const app = await NestFactory.create(HelloModule);

  // 생성된 app 을 3000번 포트로 실행시킨다.
  app.listen(3000, () => console.log("서버 시작"));
}

// 생성한 bootstrap 을 호출한다.
bootstrap();

