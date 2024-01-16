import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';

// class 주입
@Injectable()
// PassportStrategy(Strategy) 로 확장
// Strategy 를 인자로 전달하는데
// `Mixin` 으로 클래스의 일부만 확장하고 싶을때 사용하는 방법
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    // 기본값이 username 인데, `email` 로 변경
    super({ usernameField: 'email' });
  }

  // validate 메서드를 사용하여, user 가 있는 지확인
  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      return null; // user 가 없으면 null 반환
    }
    return user; // 있으면 user 반환
  }
}
