# Google OAuth

`google` 의 `OAuth` 사용시 `googleStrategy` 에서는 `validate()` 메서드에서  
처리하게 된다.

이때, 넘어오는 데이터는 엑세스 토큰, 리프레시 토큰, 프로필 정보이다
프로필에서 식별자로 사용하는 `ID` 가 존재하는데, 이를 `providerId` 로 부른다
이외에 여러 정보를 가져온다.

프로젝트에서 유저 정보의 키로 사용하는 이메일 정보도 가지고 있다.
지금 현재 만드는 애플리케이션의 유저 식별자는 이메일이다.

구글 `OAuth` 로 가입한 유저는 패스워드가 없으므로, 구글 `OAuth` 로 가입한  
유저라는것을 알 수 있도록 구글 `OAuth` 식별자인 `ProviderId` 를 같이 저장한다.

이를 위해 `User Entity` 를 수정할 필요가 있다
그이전에 `NestJS` 에서 `config` 파일을 사용해야 하므로, 설정 파일 먼저 추가한다.

```ts

GOOGLE_CLIENT_ID={내용}
GOOGLE_CLIENT_SECRET={내용}

```

그리고 `google.strategy.ts` 에 `passport-google-oauth2` 를 사용하여  
전략을 만든다

```ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { UserService } from 'src/user/user.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  // super 에 사용할 옵션값을 준다
  constructor(private readonly userService: UserService) {
    super({
      // oauth 에서 사용할 client Id
      clientId: process.env.GOOGLE_CLIENT_ID,
      // oauth 에서 사용할 client 비밀키
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // 구글 OAuth 인증후 실행할 url
      callbackUrl: 'http://localhost:3000/auth/google',
      // 인증이후 요청할 데이터들
      scope: ['email', 'profile'],
    });
  }

  // validate 로는 `accessToken`, `refreshToken`, `profile` 의 인자를 받는다
  // 이는 `OAuth` 인증이 끝나고 콜백 URL 실행하기전 유효성을 검증한다
  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    // 전달받은 `profile` 에서 해당하는 값을 구조분해할당
    const { id, name, emails } = profile;
    console.log(accessToken);
    console.log(refreshToken);

    const providerId = id;
    const email = emails[0].value;

    console.log(providerId, email, name.familyName, name.givenName);
    // profile 반환
    return profile;
  }
}

```

이제 `authModule` 에 해당 전략을 `provider` 로 등록한다.

```ts

import { GoogleStrategy } from './google.strategy';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { SessionSerializer } from './session.serializer';

@Module({
  // PassportModule 등록
  // session 사용을 위해 옵션상 true
  imports: [UserModule, PassportModule.register({ session: true })],
  // LocalStrategy, SessionSerializer 를 프로바이더로 등록
  providers: [AuthService, LocalStrategy, GoogleStrategy, SessionSerializer],
  controllers: [AuthController],
})
export class AuthModule {}

```

이 다음 사용할 `GoogleAuthGuard` 를 만든다.

```ts

// 새로운 가드 주입
// 구글 oauth 가드 생성
export class GoogleAuthGuard extends AuthGuard('google') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // super.canactivate 는 `google strategy` 의 `validate` 를 실행
    const result = (await super.canActivate(context)) as boolean;
    // 해당하는 라우트의 request 객체를 가져옴
    // const req = context.switchToHttp().getRequest();
    // 값 반환
    return result;
  }
}

```

그리고 컨트롤러에 적용한다

```ts
  @UseGuards(GoogleAuthGuard)
  @Get('to-google')
  async googleAuth(@Request() req) {
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  async googleAuthRedirect(@Request() req, @Response() res) {
    const { user } = req;
    return res.send(user);
  }

```

역시서 총 2개의 라우터로 나뉘어져 있는데
`to-google` 라우터는 구글 인증하는 페이지로 넘어가는 라우터이고,
인증이후, `validate` 함수를 실행시켜 문제가 없다면,  
내부적인 메서드인 `googleAuthRedirect()` 메서드를 실행한다.

> `GoogleStrategy` 에서 `callbackURL` 로  `http://localhost:3000/auth/google`  
로 한것을 생각하면 당연한 결과이다.

`googleAuthRedirect()` 메서드에서 `req.user` 를 가져와 `client` 로 응답하는 역할을 한다.

> 여기서 개인적으로 애매한 부분이 있었다.
> 내 생각으로는 정상작동을 하면 안되는데, 제대로 작동한다는 것이다.
>
> 왜냐하면 현재 `deserializeUser` 를 통해 `db` 에서 `this.authService.find` 를  
사용하여 값을 찾고있다.
>
> 현재 `db` 에 저장하는 로직이 전혀 없으므로, 에러가 뿜뿜 할것이라고 생각  
했는데, 너무 잘 동작한다.
>
> 이를 통해 약간 알아보니, `OAuth2` 전략에서는 유저가 직접 설정한  
`deserializeUser` 를 사용하지 않는다고 한다.
>
> 엥??
>
> 내부적으로 구현된 `deserilizeUser` 를 사용하여, `req.user` 에 값을  
> 할당한다고 말하는듯하다.
>
> 일단 다음글에서는 `db` 에 해당 유저를 저장하는 로직을 만들것 같으니 넘어간다...

## User entity 파일 수정

우리 `db` 상에서는 `password` 가 `local` 에서는 필요하지만,  
`OAuth` 상에서는 불 필요하다.

> `OAuth` 는 소셜미디어를 통해서 로그인하므로 우리가 비밀번호에 대해  
알필요가 없다.

그러므로, `Entity` 역시 `password` 를 필수값이 아니게 수정하고,  
`OAuth` 시 알수있도록, 식별자를 추가해야 한다.
여기서는 `providerId` 를 추가한다.

```ts

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Entity 데커레이터
@Entity()
// User Entity 클래스
export class User {
  // 자동증가 primary 컬럼
  @PrimaryGeneratedColumn()
  id?: number;
  // unique 컬럼
  @Column({ unique: true })
  email: string;
  // password 컬럼
  // null 값 허용
  @Column({ nullable: true })
  password: string;
  // 컬럼
  @Column()
  username: string;
  // OAuth Provider 아이디
  // null 값 허용
  @Column({ nullable: true })
  providerId: string;

  // type 이 datetime 인 컬럼
  // 기본값을 넣어준다
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdDt: Date = new Date();
}


```

이제 `userServide` 에 구글 유저를 검색하거나 저장하는 메서드를  
만든다

`user.service.ts`

```ts

  // 이메일로 찾거나 저장하는 메서드
  async findByEmailOrSave(
    email: string,
    username: string,
    providerId: string,
  ): Promise<User> {
    // user 를 찾는다
    const foundUser = await this.findUser(email);
    // 해당 user 가 있다면 user 리턴
    if (foundUser) {
      return foundUser;
    }
    // 없다면 새로운 user 생성
    const newUser = await this.userRepository.save({
      email,
      username,
      providerId,
    });
    // 새로운 user 반환
    return newUser;
  }

```

`strategy` 를 사용하여 메서드를 저장하도록 처리해주어야 한다

```ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { UserService } from 'src/user/user.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const { id, name, emails } = profile;
    console.log(accessToken);
    console.log(refreshToken);

    const providerId = id;
    const email = emails[0].value;

    const user = await this.userService.findByEmailOrSave(
      email,
      name.familyName ? name.familyName + name.givenName : name.givenName,
      providerId,
    );

    return user;
  }
}

```

이후 `localhost:3000/auth/to-google` 로 접속하면, 로그인화면이 나오고  
로그인후 `localhost:3000/auth/google` 로 이동하며, `profile` 정보가 나온다.
이렇게 하면, 이제 `DB` 상에 저장된 `user` 로 저장되는것을 확인할 수 있다.

`OAuth` 관련된 부분은 따로 더 봐야 겠다.
지금으로써는 `local-stratege` 관련 부분만 `docs` 상의 내용을 정리했지만,  
`OAuth` 에 대한 구현부분도 `passport docs` 를 보고 확인해볼 필요가 있다.
