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
