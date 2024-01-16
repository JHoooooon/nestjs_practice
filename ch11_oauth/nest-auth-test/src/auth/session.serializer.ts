import { UserService } from './../user/user.service';
import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';

// 주입할 클래스 생성
@Injectable()
// PassportSerializer 를 상속받는 `SessionSerializer` 생성
// 이 클래스에 `serializerUser` 와 `deserializerUser` 메서드를 생성한다.
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly userService: UserService) {
    super();
  }

  // serializeUser 생성
  serializeUser(user: any, done: (err: Error, payload: any) => void) {
    // session storage 에 저장될 값 사용
    // 여기서는 `user.email` 을 저장한다.
    done(null, user.email);
  }

  // deserializerUser  생성
  async deserializeUser(
    email: string,
    done: (err: Error, payload: any) => void,
  ) {
    // email 을 사용하여 `user` 찾기
    const user = await this.userService.findUser(email);
    // user 가 없다면
    if (!user) {
      // error 생성
      done(new Error('유저가 없습니다.'), null);
    }
    // user 에서 password 삭제
    delete user.password;
    // done 함수에 user 객체를 넘겨
    // req.user 에 `user` 객체 할당
    done(null, user);
  }
}
