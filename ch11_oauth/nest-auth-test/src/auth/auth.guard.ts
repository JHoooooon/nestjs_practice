import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class LoginGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}
  async canActivate(context: ExecutionContext) {
    // context 에서 req 객체를 가져온다
    const req = context.switchToHttp().getRequest();

    // login cookie 가 있다면 true 반환
    // 그렇지 않다면, 나머지 로직들 실행
    //
    // cookie 가 있다면 로그인한 유저이므로 `guard` 통과
    if (req.cookies['login']) {
      return true;
    }

    // req.body.email 이나 req.body.password 가 있는지 확인
    // 없다면 유효하지 않으므로 `false` 반환
    if (!req.body.email || !req.body.password) {
      return false;
    }

    // this.authService 에서 validateUser 를 사용하여 검증처리
    // 검증되었다면 userInfo 반환 아니면 null 반환
    const userInfo = await this.authService.validateUser(
      req.body.email,
      req.body.password,
    );

    // userInfo 가 null 이면 false 리턴
    if (!userInfo) {
      return false;
    }

    // req.user 에 userInfo 할당
    // 이후부터 `req.user` 로 `user` 정보 접근 가능
    req.user = userInfo;

    // 문제 없다면 true 반환
    return true;
  }
}

// guard 주입 선언
@Injectable()
// AuthGuard 상속
// AuthGuard 는 인자 값으로 `사용할 전략` 을 문자열로 받는다.
// 인자 type 은 `string | string[]` 이다
// 여기에는 `local` 전략을 사용
export class LocalAuthGuard extends AuthGuard('local') {
  // guard 이므로 canActivate 를 사용
  async canActivate(context: ExecutionContext) {
    // 확장한 `AuthGuard` 에 `context` 를 넘겨
    // `local` 전략 실행
    // super.canActivate 를 호출하면, `AuthGuard` 내부에서
    // `local` 전략을 실행한다.
    // 문제가 없다면 `true` 를 반환 아니면 `false`
    // 개인적으로 `passport.authenticate` 사용시
    // 미들웨어 안에 미들웨어로써 사용하기 위해 함수로 한번 더
    // 감쌌는데, 이를 비슷하게 구현되는 느낌이 든다.
    const result = (await super.canActivate(context)) as boolean;
    // 해당 라우트의 request 객체를 가져옴
    const req = context.switchToHttp().getRequest();
    // super.logIn 을 사용하여 `request` 객체를 인자값으로 넘겨준다.
    // 이를 통해 `AuthGuard` 의 메서드인 `logIn` 을 호출하여 처리한다.
    // 이는 `passport.authenticate` 에서 `req.login` 을 생성하고 반환하여
    // 실행하는 로직과 같다.
    //
    // > 참고로 `passport.authenticate` 는 `login` 구현을 안해도
    //   자동적으로 `login` 을 호출한다.
    //   개인적인 생각으로 `req.login(req.user, (err) => {...})`
    //   를 내부적으로 처리하지 않을까 싶다..
    //
    await super.logIn(req);
    // result 는 boolean 값이므로,
    // `local` 전략이 제대로 실행되었으면 true 일 것이다.
    return result;
  }
}

// 새로운 가드 주입
@Injectable()
// 인증 가드 생성
export class AuthenticateGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    // request 객체 반환
    const req = context.switchToHttp().getRequest();
    // request 객체에서 isAuthenticated 함수를 호출하여
    // 인증되었는지 `boolean` 값으로 반환
    // 인증되면 true, 아니면 false
    return req.isAuthenticated();
  }
}

// 새로운 가드 주입
// 구글 oauth 가드 생성
export class GoogleAuthGuard extends AuthGuard('google') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // super.canactivate 는 `google strategy` 의 `validate` 를 실행
    const result = (await super.canActivate(context)) as boolean;
    // 해당하는 라우트의 request 객체를 가져옴
    const req = context.switchToHttp().getRequest();
    await super.logIn(req);
    // 값 반환
    return result;
  }
}
