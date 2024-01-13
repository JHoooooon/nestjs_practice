import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/user/user.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  // 사용할 userService 주입
  constructor(private readonly userService: UserService) {}

  // 회원 register
  async register(userDto: CreateUserDto) {
    // email 로 user 찾음
    const user = await this.userService.findUser(userDto.email);

    console.log(user);

    // user 가 있다면 400 error
    if (user)
      throw new HttpException(
        '해당 유저가 이미 있습니다.',
        HttpStatus.BAD_REQUEST,
      );

    // password 암호화
    // bcrypt.hash(data: string | buffer, saltOrRound: string | number)
    // 첫번째 인자는 data 주체이고,
    // 두번째 인자는 사용할 salt, 및 해싱횟수(round) 를 받는다.
    const encryptedPassword = await bcrypt.hash(userDto.password, 10);

    try {
      // user 생성
      const user = await this.userService.createUser({
        ...userDto,
        password: encryptedPassword,
      });
      // 생성된 user 에서 password 삭제
      delete user.password;
      // user 반환
      return user;
    } catch (error) {
      // error 발생시 500 error
      throw new HttpException('서버에러', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  // user 검증 service
  async validateUser(email: string, password: string) {
    // user 를 찾는다
    const user = await this.userService.findUser(email);

    // user 없으면 null
    if (!user) {
      return null;
    }

    // hashedPassword 와 userInfo 를 구조분해할당
    const { password: hashedPassword, ...userInfo } = user;

    // bcrypt 를 사용하여, hashedPassword 와 password 값이 맞는지 확인
    if (await bcrypt.compare(password, hashedPassword)) {
      // 값 비교시 맞다면,
      // userInfo 반환
      return userInfo;
    }

    // 아니면 null
    return null;
  }
}
