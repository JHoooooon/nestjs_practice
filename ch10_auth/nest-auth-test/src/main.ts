import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser()); // cookieParser 적용
  app.use(
    session({
      // 세션 쿠키의 암호화를 위해 사용된다
      // 이는 쿠키가 탈취되더라도 세션 데이터에 접근할수 없도록 하기 위함이다.
      secret: 'very-important-secret',
      // `session` 이 요청에 위해 수정되지 않았더라도, `session` 저장소는
      // 다시 저장하도록 강제한다.
      // `default` 로는 `true` 이지만 나중에는 변경될 수 있다고 한다.
      // 일반적으로 `false` 로 처리한다고 한다.
      //
      // 그럼 `true` 일때 언제사용하지?
      // 예를 들어, 1시간의 유효시간이 있는 쿠키가 있다고 하자.
      // 어떤 라우트에 접근시, `session` 저장소에 새로운 값을
      // 할당하고 응답한다면, 이를 통해 새로운 `cookie` 가 생성된다.
      // 새로운 `cookie` 가 생성되었으므로 유효시간이 다시 1시간으로
      // 초기화된다.
      // 이처럼 `true` 를 사용해야만 하는 상황이 생기기도 하다.
      resave: false,

      // saveUninitialized 는 해당 라우터에서 세션 저장소에 값을
      // 저장하면 바로 사용할 수 있도록 한다.
      // 반면 false 일때, 바로 사용 불가능하다.
      //
      // 이유는 `false` 일때, 세션 객체가 처음에는 저장되지 않는다.
      // 왜냐하면, session 저장소가 `null` 또는 `undefined` 라고 한다.
      // 이후 해당 라우터에서 값을 생성 할당 하더라도,
      // 바로 사용이 불가능하다.
      // 세션 객체 생성되는것이 비동기로 처리된다.
      //
      // 반면, `true` 일때, 세션 객체가 서버 시작시 생성된다.
      // 이후 라우터에서 동기적으로 할당 및 접근이 가능하다
      //
      // 비동기적일땐, 서버 사용량은 줄일 수 있으며, 다중 병렬 요청시
      // `race condition` 에 도움이 된다.
      // `false` 를 권장하는 분위기다.
      //
      saveUninitialized: false,
      //
      // 밀리초 단위로 만료 시간을 설정한다.
      // 아래는 1000 * 60 * 60 즉, 1시간을 설정한다.
      cookie: { maxAge: 3600000 },
    }),
  );
  app.use(passport.initialize()); // 패스포트 초기화
  app.use(passport.session()); // 패스포트를 통해 세션 저장

  await app.listen(3000);
}
bootstrap();
