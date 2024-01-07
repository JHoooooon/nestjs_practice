# 인증 Cookie-Session

보통 `인증-인가` 는 거의 모든 앱에서 존재한다.
회원가입 및 회원인증 이후 인증된 회원이 앱상에 접근하여  
허용된 권한에 의해 처리될 수 있는 여러 로직들을 처리 해야 한다.

이러한 과정을 `인증(Authentication)` 과 `인가(Authorization)` 이라 한다.

`NestJS` 에서 이러한 [Authentication](https://docs.nestjs.com/security/authentication) 과 [Authorization](https://docs.nestjs.com/security/authorization) 을 처리하는 방법에 대해서 따로 서술하고 있다.

## Authentication

[NestJS Authentication](https://docs.nestjs.com/security/authentication) 에서 제공하고 있는 내용을 먼저 정리해보자.

```sh

\$ nest g module auth
\$ nest g controller auth
\$ nest g service auth

```

일단 이렇게 `authModule`, `authController`, `authService` 를 생성한다.
그리고 `user` 에 대한 연산을 캡슐화 하는것이 유용하다고 설명하며,  
`userModule`, `userService` 를 생성한다.

```sh

\$ nest g module user
\$ nest g service user

```

`userModule` 에서는 `userService` 만 제공하면 되므로,
`userController` 는 생성하지 않는다.
이렇게 만든것을 보면 `authModule` 에서 `userModule` 을 `import` 해서 사용할  
것으로 예상된다.

`userService` 를 하드코딩해서 `user` 를 담든 `in-memory` 리스트를 간단하게  
만든다.

그리고 `find` 메서드를 통해 `username` 으로 하나의 `user` 를 찾도록 만든다.

```ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  // user in-memory list
  constructor() {
    this.users = [
      {
        userId: 1,
        username: 'john',
        password: 'changeme',
      },
      {
        userId: 2,
        username: 'maria',
        password: 'guess',
      },
    ];
  }

 // findOne method 생성
 // username 으로 user list 에서 해당 user 를 찾는 메서드
  async findOne(username) {
    return this.users.find(user => user.username === username);
  }
}

```

> 실제 `app` 에서는 `library` 를 선택하여 `user model` 및  
`persistence layer` 를 구축한다

외부 모듈에서 볼수 있도록 `@Module` 데커레이터에
`UserService` 를 `exports` 의 `array` 에 포함시킨다

> user.module.ts

```ts

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

```

## Implementing the "Sign in" endpoint

`AuthService` 는 `user` 를 탐색할수 있는 작업을 가지고 있으며,  
`password` 를 검사해야 한다.

이를위한 목적으로 `signIn()` 메서드를 생성한다.

> user.service.ts

```ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  // UserService 주입
  constructor(private usersService: UsersService) {}

  // signIn 메서드 구현
  // @params username: string
  // @params pass: string
  // @return Promise<any>
  async signIn(username: string, pass: string): Promise<any> {
    // user 가 있는지 탐색
    const user = await this.usersService.findOne(username);
    // user password 와 pass 값이 맞는지 확인
    // 아니라면 `401` 에러 발생 
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    // distructuring 을 사용하여
    // password 를 제외한 나머지 값을 result 에 할당
    const { password, ...result } = user;
    // TODO: Generate a JWT and return it here
    // instead of the user object
    //
    // result 반환
    return result;
  }
}

```

> ***WARNING***
> 물론 실제 `App` 에서는 `palin text` 인 `password` 를 저장하지 않는다.
> 대신 `sorted` 단반향 `hash algorithm` 이 포함된 `bcrypt` 같은 라이브러리를 사용한다.
  
이제 `AuthService` 의 `SingIn` 을 구현했으니 `AuthModule` 에 `UserModule` 을  
`imports` 한다

> auth.module.ts

```ts

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  // UsersModule 을 `import` 한다
  // UserModule 에서 exports 한 UserService 를
  // 주입하여 사용할수 있다.
  imports: [UsersModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}

```

`AuthController` 를 열고 `signIn()` 메서드를 추가한다
이 메서드는 `user` 인증이 `client` 에 의해 호출되는 메서드이다.

이 메서드는 `username` 과 `password` 를 `request body` 로 부터 전달받는다.
그리고 이 `user` 가 인증되었다면 `JWT token` 을 반환할것이다.

> auth/auth.controller.ts

```ts

import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
// AuthService 를 주입하기 위해 import 한다
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  // authService 에 AuthService 주입
  constructor(private authService: AuthService) {}

  // Post 로 login 처리
  // 제대로 전달받으면 200 status 코드를 보낸다
  @HttpCode(HttpStatus.OK)
  @Post('login')
  // rquest body 로 { string: any } 타입인 signInDto 를 받는다
  // signInDto 를 따로 생성하지 않고 그냥 아무값이나 받도록
  // 처리한듯하다.
  signIn(@Body() signInDto: Record<string, any>) {
    // 받은 signInDto 의 username 과 password 를 
    // authService.signIn 함수의 인자로
    // 할당하여 호출한다
    return this.authService.signIn(signInDto.username, signInDto.password);
  }
}

```

> ***Hint***
> 이상적으로 `request body` 의 `shape` 를 `Record<string, any>` 타입을
> 사용하는 대신 `DTO class` 를 통해 정의해야 한다
> 좀더 자세한 내용은 [validation](https://docs.nestjs.com/techniques/validation) 을 보라고 한다.

`authService` 안에 `JWT` 를 생성을 처리할것이다.
`@nestjs/jwt` 를 `install` 한다

```sh

\$ npm i @nestjs/jwt

```

`JWTService` 를 주입하고 `JWT token` 을 생성하기 위해  
`signIn` 메서드를 업데이트 한다.

> `auth.service.ts`

```ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
// `JWTService` 를 import
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    // JwtService 를 주입
    private jwtService: JwtService
  ) {}

  async signIn(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    // payload 값을 작성한다.
    // payload 에는 claims 가 존재하는데 마지 token 에 대한
    // metadata 같은 역할을 한다
    //
    // 아래는 이미 등록되어진 claims 를 말한다
    // Payload Registered Claims:
    //
    // - sub: Subject
    // - iss: issuer
    // - aud: audience
    // order....
    //
    // 이외에 다른 public claims, private claims 가 있다.
    const payload = { sub: user.userId, username: user.username };

    // access_token 을 가진 객체를 반환
    return {
      // jwtService 에서 payload 를 sign 하여 access_token
      // 값 전달
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}

```

`@nestjs/jwt` 라이브러리를 사용한다.
`@nestjs/jwt` 는 `signAsync()` 함수를 통해 `user` 객체의 하위 집합으로  
부터 `JWT` 를 생성한다

이 과정을 통해서 `access_token` 프로퍼티를 가진 객체를 반환한다.

> 추가적으로, `JWT` 표준과 일치하도록 `userId` 값을 유지하기 위해  
> `sub` 속성값을 선택하였다.

이제 `AuthModule` 에서 `JwtModule` 설정 그리고 새로운 종속성을  
`import` 할 필요가 있다.

첫번째로, `auth` 폴더에서 `constants.ts` 를 생성한다.

> auth/constants.ts

```ts

export const jwtConstants = {
  secret: 'DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.',
};

```

이를 사용하여 `JWT` 검증 및 서명 단계간에 `key` 를 공유하여 사용할 것이다.

> ***WARNING***
> **`key` 를 공적으로 노출하지 말아야 한다** `production system` 에서는  
> 이 키를 반드시 보호해야만 한다.
>
> `vault` 나 `.env` 같은 환경변수를 사용하여 처리하라고 강조한다.

이제 `authModule` 에 `JwtModule` 을 등록한다.

```ts

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    // JwtModule 동적 모듈 등록
    JwtModule.register({
      global: true, // 전역환경으로 등록
      secret: jwtConstants.secret, // HMAC 알고리즘의 secret 
      signOptions: { expiresIn: '60s' }, // seconds 또는 문자열로 서술된 
                                         // 만료기간 -> 60초
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

```

`JWTModule` 은 `configuration` 객체를 전달하여 `register()` 함수를 사용한다.
`JwtModule` 을 좀더 보고 싶다면 [here](https://github.com/nestjs/jwt/blob/master/README.md) 을 참고하자.

```sh

$ # POST to /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
$ # Note: above JWT truncated

```

`Docs` 에서는 위처럼 나온다고 한다.

> 이건 `NestJS` 의 `Authentication` 흐름을 알고 싶기에 내용을 정리하는것  
뿐이다. 이후에 `JWT` 인증 관련해서 직접 구현해 볼것이다.

## Implementing the authentication guard

`guard` 는 `request` 에서 제공된 유효한 `JWT` 있도록 하기 위해
`endpoint` 를 보호한다.

이를 위해 `AuthGuard` 를 생성한다.
`AuthGuard` 는 `routes` 를 보호해주는 역할을 한다

`Guard` 를 생성하기 전에 먼저 `CanActivate` 인터페이스 먼저봐야 한다.

```ts

import { Observable } from 'rxjs';
import { ExecutionContext } from './execution-context.interface';
/**
 * Interface defining the `canActivate()` function that must be implemented
 * by a guard.  Return value indicates whether or not the current request is
 * allowed to proceed.  Return can be either synchronous (`boolean`)
 * or asynchronous (`Promise` or `Observable`).
 * 
 * `canActivate` 함수는 반드시 `guard` 에 의해 구현되어야할 인터페이스를
 *  정의한다. 반환 값은 현재 요청(request)의 진행을 허가 할지 안할지를 가리킨다
 *  반환은 `비동기` (`Promise` or `Observable`)  혹은 `동기` (`boolean`) 둘중
 *  하나로 할수 있다.
 *
 * @see [Guards](https://docs.nestjs.com/guards)
 *
 * @publicApi
 */
export interface CanActivate {
    /**
     * @param context Current execution context. Provides access to details about
     * the current request pipeline.
     * 
     * context 는 현재 실행 컨택스트이다. 
     * 현재 요청 파이프라인에 대한 세부정보를 제공한다
     *
     * @returns Value indicating whether or not the current request is allowed to
     * proceed.
     * 
     * return 값은 현재 요청에 대한 진행을 허가할지 안할지 결정한다
     * 
     */
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
}


```

위를 보면 알겠지만, `Guard` 생성시 `CanActivate` 인터페이스를 구현해야 한다  
`canActivate` 함수가 존재하는데, 여기에는 실행 컨텍스트를 인자값으로 가지고  
있으며, 반환값은 `Promise<boolean>` 값 이거나 `Observable<boolean>`, `boolean` 이다.

애라는 이러한 `Guard` 를 구현한 `AuthGuard` 코드이다.

```ts
import {
  CanActivate, // Guard 생성시 필요한 
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { Request } from 'express';

// 주입될 Provider 생성
@Injectable()
// CanActive Interface 구현 확장
export class AuthGuard implements CanActivate {
  // JwtService 주입
  constructor(private jwtService: JwtService) {}

  // canActivate 함수 생성
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // context 를 사용하여 http 로 변환 및 `request` 객체 가져옴
    const request = context.switchToHttp().getRequest();
    // 요청의 header 값에서 token 추출
    const token = this.extractTokenFromHeader(request);
    // token 이 없다면 401 에러
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      // token 검증
      const payload = await this.jwtService.verifyAsync(
        token,
        {
          secret: jwtConstants.secret
        }
      );
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      //
      // request.user 에 payload 값 할당
      request['user'] = payload;
    } catch {
      // 검증실패시 401 에러
      throw new UnauthorizedException();
    }
    // request 진행 허용
    return true;
  }

  // extractTokenFromHeader 함수
  private extractTokenFromHeader(request: Request): string | undefined {
    // request.headers.authorization 으로 부터 type 과 token 분리
    // headers: { authorization: "Bearer token" } 방식 request 에서 가져옴
    // "Bearer token" 문자열이므로, split 을 사용하여 빈 공백을 기준으로
    // 나누고 배열로 만듬 하지만 없다면 빈 배열을 반환
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    // type 에 `Bearer` 가 있다면 token 값을 반환
    // 그렇지 않다면 undefined 반환
    return type === 'Bearer' ? token : undefined;
  }
}

```

이렇게 `route` 보호를 위해 구현할수 있으며, 보호하고 싶은곳에 `AuthGuard`  
를 등록하도록 한다

> auth.controller.ts

```ts

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  // UseGuards 데커레이터를 사용하여
  // AuthGuard 를 인자값으로 넣는다.
  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}

```

특정 `route` 만 보호되도록 `Get /profile` `route` 에만 생성한다
`App` 을 실행중인지 확인하고, `curl` 을 사용하여 `route` 를 테스트한다

```sh

$ # GET /profile
$ curl http://localhost:3000/auth/profile
{"statusCode":401,"message":"Unauthorized"}

$ # POST /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."}

$ # GET /profile using access_token returned from previous step as bearer code
$ curl http://localhost:3000/auth/profile -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
{"sub":1,"username":"john","iat":...,"exp":...}

```

`JWT` 설정으로 `60 seconds` 의 만료기간을 가지고있다
`Token` 만료 및 새로고침에 대한 세부 정보를 다루는 것은 이 문서의 범위를 벗어난다.
그러나 `JWT` 의 중요한 특징을 서술하기 위해 해당 옵션을 적용했다
만약, `GET /auth/profile` 요청을 시도하기전에 인증 이후 60초를 기다린 경우  
`401 Unauthorized` 응답을 받을것이다.

`@nestjs/jwt` 는 자동적으로 `JWT` 만료시간을 체크하여 어플리케이션에서  
만료시간 체크를 수행하는 수고를 덜어준다

이제 `JWT` 인증구현이 완료되었다
`javascript` 클라이언트는 `API server` 와 함께 인증을 하고 안전하게  
커뮤니케이션할수 있다.

## Enable authentication globally

기본적으로 보호해야할 `endpoints` 가 대다수인 경우, `global guard` 로써  
인증 `guard` 를 등록할수 있으며, 각 컨트롤러 위에 `@UseGuards()` 데커레이터를  
사용하는 대신 어떤 경로를 공개해야 하는지 간단히 플래그를 지정할 수 있다

첫번째로 `global guard` 로써 `AuthGuard` 를 등록한다

> `auth.module.ts`

```ts

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    // JwtModule 동적 모듈 등록
    JwtModule.register({
      global: true, // 전역환경으로 등록
      secret: jwtConstants.secret, // HMAC 알고리즘의 secret 
      signOptions: { expiresIn: '60s' }, // seconds 또는 문자열로 서술된 
                                         // 만료기간 -> 60초
    }),
  ],
  providers: [
    AuthService, 
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    }
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

```

`Nest` 에서 `AuthGuard` 는 모든 `endpoint` 와 자동적으로 바인드된다.

경로를 공개로 선언하는 매커니즘을 제공해야 한다
이러한 매커니즘을 제공하기 위해서 `SetMetadata` 데커레이터 팩토리 함수를  
사용하여 정의 데코레이터를 만들 수 있다.

```ts

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

```

위에 파일을 보면, 두개의 상수를 `export` 하고 있다
하나는 `IS_PUBLIC_KEY` 라는 이름을 가진 `metadata` 이고,
다른 하나는 `Public` 으로 부를 새로운 데커레이터 자체이다.
> 당신의 프로젝트에 맞는 이름 `SkipAuth` 또는 `AllowAnon` 으로 지정할  
수도 있다. (원하는것으로 명명지어질 수 있다는 이야기다)

이제 커스텀 `@public()` 데커레이터를 가지고 있으며, 이 데커레이터를  
사용할 수 있다

```ts

@Public()
@Get()
findAll() {
  return [];
}

```

---

마지막으로, `isPublic` 메타데이터를 찾을때 `AuthGuard` 가  
`true` 를 반환할 필요가 있다.
이를 위해 `Reflector` 클래스를 사용할 것이다.
> 이에 대해서는 [here](https://docs.nestjs.com/guards#putting-it-all-together) 을 확인하라고 한다
>
> 그냥 넘어가려고 했는데, `Refector` 에 대한 내용을 살펴봐야 다음 코드가  
> 이해가 간다.
>
> 해당 내용은 [Reflection and metadata](https://docs.nestjs.com/fundamentals/execution-context#reflection-and-metadata) 부분이다.
>
> `Nest` 는 `Reflector#createDecorator` 를 통해 생성된 데커레이터를 통해  
> `custom metadata` 를 `route handlers` 로 부착하기 위한 기능과
> `@setMetadata()` 데커레이터를 제공한다
>
> 이번 섹션에서, 이 두 접근법을 비교하고, `interceptor` 또는 `guard` 내에서  
> 어떻게 `metadata` 로 접근하는 방법을 보게될것이다.
>
> `Reflector#createDecorator` 를 사용하여 강타입 데커레이터를 생성하려면,  
> 타입 인자를 지정해줄 필요가 있다
> 예를 들어, `string array` 타입 인자를 가진 `Roles` 을 생성한다
>

`rolse.decorator.ts`

```ts

import { Reflector } from '@nestjs/core';

export const Roles = Reflector.createDecorator<string[]>();

```

>
> 여기서 `Roles` 데커레이터는 `string[]` 타입의 단일 인자를 취하는 함수이다.
> 간단히 핸들러에 주석을 달아서 이 `decorator` 를 사용할 수 있다

```ts

@Post()
@Roles(['admin'])
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}

```

> 여기에서 `Roles` 데커레이터 메타데이터를 `create()` 에 부착했고,  
> 이는 관리자 역할이 있는 사용자만 이 경로에 엑세스할수 있음을 나타낸다.
>
> 경로 `role` 에 접근하려면(커스텀 메타데이터), 다시 `Reflector` 헬퍼 클래스를 사용해야 한다.  
> `Reflector` 는 일반적인 방법으로 `class` 에 주입될 수 있다.

```ts

@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {}
}

```

>> ***HINT***
>> `Reflector` 클래스는 `@nestjs/core` 패키지로 부터 `import` 된다
>
> `get()` 메서드를 사용하여, 메타 데이터 헨들러를 읽는다
>

```ts

@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {
    const roles = this.reflector.get(Roles, context.getHandler());
  }
}

```

> 이 `Reflector#get` 메서드는 두 `arguments` 를 통해서 `metadata` 에  
> 쉽게 접근을 허용한다.
>
> 이 두 `arguments` 는 메타데이터를 검색할 데커레이터 참조  
> 그리고 `context`(데커레이터 타겟) 이다.
> 이 예제에서, 지정된 데커레이터는 `Roles` (`roles.decoratiro.ts` 파일에 있는)  이다
>
> `context` 는 `context.getHandler()` 를 호출을 통해 제공된다
> 이 결과는 현재 진행된 `route handler` 에 대한 `metadata` 가 추출된다.
> `getHandler()` 는 라우트 `handler function` 에 대한 참조를 제공한다
>
> 또한, 메타데이터를 적용하기 위해 `controller` 를 구성할 수 있다
>

```ts

@Roles(['admin'])
@Controller('cats')
export class CatsController {}

```

> 이 경우, `controller` 메타데이터를 추출하려면, 두 번째 인자로 `context.getClass()`  
> 를 전달한다. (메타데이터 추출을 위한 컨텍스트로 클래스 `controller` 를 제공하기 위해)
>
> 그러므로 다음처럼 `roles.guard.ts` 의 내용을 변경한다

```ts
const roles = this.reflector.get(Roles, context.getClass())
```

> 여러 수준(`level`)에서 `metadata` 를 제공하는 능력을 제공하려면, 각 `context` 로  
> 부터 `metadata` 를 병합하고, 추출할 필요가 있다
> `Reflector` 클래스는 이를 지원하는데 사용되는 `utility methods` 두개를  
> 제공한다.
>
> 이 메서드들은 한번에 `method` 그리고 `conroller` 양자모두의 `metadata` 를  
> 추출하고 다양한 방식으로 결합한다
>
> 두 레벨(`level`)(`controller`, `router`) 모두에 `Roles` 메타데이터를  
> 제공한 다음의 상황을 고려해보자

`cats.controller.ts`

```ts

@Roles(['user'])
@Controller('cats')
export class CatsController {
  @Post()
  @Roles(['admin'])
  async create(@Body() createCatDto: CreateCatDto) {
    this.catsService.create(createCatDto);
  }
}

```

> 만약 기본 `role` 을 `user` 로 지정하도록 하고 특정  
> 메서드들에 대해 선택적으로 재정의하는 경우, 아마도  
> `getAllAndOverride()` 메서드를 사용할 것이다.

```ts

const roles = this.reflector.getAllAndOverride(Roles, [context.getHandler(), context.getClass()]);

```

> `create()` 메서드(`CatsController` 의 라우터인 `create` 메서드)의  
> 컨텍스트에서 실행되는 이 코드가 있는 가드는  
> 위의 `metadata` 를 사용하면 `[admin]` 이 포함된 `Roles` 가 생성된다
>
> 둘다에 대한 `metadata` 를 가져와 병합하려면, `getAllAndMerge()` 메서드를  
> 사용한다

```ts

const roles = this.reflector.getAllAndMerge(Roles, [context.getHandler(), context.getClass()]);

```

> `['user', 'admin']` 을 포함한 `role` 결과가 생성된다
> 이 두가지 병합 방법 모두에 대해, 첫번째 인자로는 `metadata` 의 `key`를,  
> 그리고 두번째 인자로 `metadata` 의 `target context` 를 전달했다.
>> ***metadata 의 target context:***
>> 여기에서 `getHandler()` 와/또는 `getClass()` 메서드를 호출했다.
>
> ***Low-level approach***
>
> `Reflector#createDecorator` 를 사용하는 대신, `handler` 에 `metadata` 를  
> 첨부하기 위해 내장된 `@SetMetadata()` 데커레이터를 사용할 수 있다
>
> ***HINT***
> `@SetMetadata()` 는 `@nestjs/common` 패키지로 부터 `import` 한다

`cats.controller.ts`

```ts

@Post()
@SetMetadata('roles', ['admin'])
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}

```

>
> `create()` 메서드에 `roles` 메타데이터를 첨부한다
> (`roles` 는 메타데이터 키 이고, `['admin']` 는 연관된 값이다)
> 이것이 작동되는 동안, `@SetMetadata()` 를 직접적으로 `routes` 에 사용하는건  
> 좋지 않다고 한다.
> 대신에, 아래처럼 `decorator` 를 생성할수 있다고 한다.

`roles.decorator.ts`

```ts
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

```

> 이 접근법은 더 깔끔하고, 좀더 읽기 쉽다. 그리고 `Reflector#createDecorator`  
> 접근과 다소 닮았다
> 차이점은 `@SetMetadata` 를 사용하면 메타데이터 키와 값을 더 효과적으로  
> 제어할 수 있다. 그리고 둘 이상의 인수를 사용하는 데코레이터를 만들수도  
> 있다.
>
> 커스텀 `@Roles` 데커레이터를 가지고 있고, `create()` 메서드에 사용하고 있다.

`cats.controller.ts`

```ts

@Post()
@Roles('admin')
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}

```

> 경로의 `roles` 에 엑세스 하기 위해, `Reflector` 헬퍼 클래스를 다시
> 사용한다

`roles.guard.ts`

```ts

@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
  }
}

```

> 여기서는 데커레이터 참조를 전달하는 대신 `metadata` 의 `key` 를  
> 첫번째 인수( = `roles`)로 전달한다.  
> 다른 모든 것은 `Reflector#createDecorator` 예제외 동일하게 유지된다.

---

지금까지가 `Reflector` 와 `@SetMetadata` 에 관련된 내용이다.
이제 밑의 `AuthGuard` 의 코드가 이해가기 시작한다.

다시 `Public` 데커레이터를 보고, 이를 통해 구현할 `Guard` 를 보자

```ts

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

```

```ts

@Injectable()
export class AuthGuard implements CanActivate {
  // Reflector 를 @nestjs/core 에서 가져온다
  // 그리고 주입한다
  constructor(private jwtService: JwtService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // `reflector` 를 사용하여 `IS_PUBLIC_KEY` 의 `metdata` 를 가져온다.
    // 첫번째 인자는 가져올 `Metadata` 의 `key` 이다.
    // 두번째 인자는 타겟 컨텍스트인 `handler` 와 `class` 이다.
    // getAllAndOverride 는 `default` 값으로 상위 level 의 값을 사용하고,  
    // 하위 레벨에 직접 `decorator` 를 사용한다면,
    // 하위 레벨의 값으로 덮어 씌어진다 
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // 만약 `isPublic` 값이 있으면 `true` 값을 반환한다
    // 즉, 이 아래의 로직들을 실행하지 않는다
    if (isPublic) {
      // 💡 See this condition
      return true;
    }

    // isPublic 이 없다면,
    // 이는 `Authentication` 을 확인해야 하는 상황이다.
    //  request 객체를 가져오고,
    const request = context.switchToHttp().getRequest();
    // request 객체로 부터 `token` 값을 가져온다
    const token = this.extractTokenFromHeader(request);
    // 해당 `token` 이 없다면 401 에러
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      // token 을 검증 및 deconding
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      // 
      // deconding 된 payload 값을 request.user 의 값을 넣음
      request['user'] = payload;
    } catch {
      // try 에서 error 발생시 401 에러
      throw new UnauthorizedException();
    }
    // 아무 이상없이 작동된다면 true 반환
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

```

### Passport integration

일반적으로 대부분의 `node.js` 인증 라이브러리는 커뮤니티에 의해 잘 만들어진  
`passport` 를 사용한다.
이부분에 대해서는 [@nestjs/passport](https://docs.nestjs.com/recipes/passport) 에서 보도록 하자.

지금까지가 `Authentication` 의 내용 정리다.
다음은 `Authorization` 에 대한 내용을 살펴본다.

---

## Authorization

해당 내용은 [NestJS Authorization](https://docs.nestjs.com/security/authorization) 의 내용을 정리한것이다.

`Authorization` 은 진행 여부를 가리킨다.  
이는 어떤 유저가 무엇을 할수 있는지를 결정한다.

예를 들어, 관리자 유저는 포스트의 생성, 수정, 삭제를 허용한다.
반면에 관리자가 아닌 유저는 포스트를 오직 읽기 권한만 부여받는다.

`Authorization` 은 `Authentication` 으로 부터 직교(`orthogonal`)하고, 독립적이다. 그러나 `Authorization` 은 `Authentication` 매커니즘이 필요하다.

> 여기서 `orthogonal` 이라는 의미가 쓰이는데, 간단하게 `직교` 라는 뜻이다.
> 수학에서 말하는 `직교` 는 두 선분이 `90도` 를 이룰때, `직교` 한다 라는  
> 표현을 쓴다. 이는 두 선분의 길이가 달라 길든 짧든, 항상 `90도` 를  
> 유지하므로, `서로 독립적이며 연관되어 있다는` 의미로도 쓰인다.
>
> 현재 `Authorization` 은 권한부여를 담당하여 `Authentication` 과는  
> 독립적으로 사용되지만, `Authentication` 과 연관되어 있다는 의미로  
> 사용되는 단어인듯 하다.

`Authorizaion` 을 처리하는 많이 다양한 접근방식과 전략이 있다
이 프로젝트의 접근방식은 특정 `Application` 의 요구사항에 따라 다르다
이 챕터에서는 `Authorizaion` 의 약간의 접근방식을 제공하며, 다양한 요구사항에  
조정할 수 있다.

### Basic RBAC Implementation

`Role-based access control`(**RBAC**) 은 규칙과 권한에 관한  
`policy-neutral access-control`(정책 중립적인 접근 제어) 메커니즘을 정의한다.

이번 섹션에서, `Nest guards` 를 사용한 매우 기본적인 `RBAC` 매커니즘을 어떻게  
구현하는지 설명할 것이다.

첫번째로, `Role` `enum` 을 생성한다. 이는 `system` 의 `roles` 를 보여준다.

`roles.enum.ts`

```ts

export enum Role {
  User = 'user',
  Admin = 'admin',
}

```
  
> **HINT**
> 좀더 복잡한 `systems` 에서는, `database` 에 `roles` 를 저장하거나,  
> 외부의 `authentication` 프로바이더로 부터 가져올것이다.

그리고 `@Roles()` 데커레이터를 생성할 수 있다.
이 데커레이터는 특정 리소스들에 접근하는데 필요한 `roles` 를 지정할 수 있다.

`roles.decorator.ts`

```ts

import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

// SetMetadata 에 사용될 key
export const ROLES_KEY = 'roles';
// Roles Decorator 생성
// 함수의 인자로 Role[] 타입을 가진 ...roles 를 가지며,
// ...roles 는 가변인자라고 한다.
// 해당 roles 를 Metadata 로 저장한다
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

```

커스텀 `@Roles()` 데커레이터를 가지고 있으며, 어떠한 `route handler` 에  
사용할수 있다.

`cats.controller.ts`

```ts

@Post()
@Roles(Role.Admin)
create(@Body() createCatDto: CretaeCatDto) {
  this.catsService.create(createCatDto);
}

```

마지막으로, `RolesGuard` 클래스를 생성하고,  
현재 사용자에게 할당된 `roles` 를 현재 진행중인 경로에 필요한  
실제 역할과 비교한다

경로들의 `roles` 에 접근할 목적으로, `Reflector` 헬퍼 클래스를 사용한다
이 헬퍼 클래스는 `framework` 에 의해 기본적으로 제공되며,  
`@nestjs/core` 패키지에 위해 가져온다.

`roles.guard.ts`

```ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  // Reflector helper class 를 주입
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // this.reflector.getAllAndOverride 를 사용하여 
    // key 는 `ROLES_KEY` 이고,
    // context 는 handler 혹은 class 인 roles 를 가져온다
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // requiredRoles 가 없다면, 이는 
    // roles 구성이 필요없는 route 이므로 guard 는 true 반환
    if (!requiredRoles) {
      return true;
    }
    // context.switchToHttp 로 request 객체를 가져온다
    // 가져온 request 에서 user 프로퍼티를 distructuring 한다
    const { user } = context.switchToHttp().getRequest();
    // requiredRoles 중 하나의 role 이 포함된다면, true
    // 그렇지 않으면 false
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

```

> ***HINT***
> `Reflector` 활용에 맞는 더 자세한 내용은 실행 컨텍스트 챕터의  
[Reflection and metadata](https://docs.nestjs.com/fundamentals/execution-context#reflection-and-metadata) 섹션에서 언급한다
>

이 예제에서, `request.user` 는 `user` 인스턴스를 가진다고 가정한다.
그리고 `roles` 를 허용한다

이 `app` 에서 아마도 당신은 커스텀 `authentication guard` 와  
연관시켜 만들었을 것이다.

> 이말은 이전에 [authentication](https://docs.nestjs.com/security/authentication) 챕터를 보고 `Authorization` 챕터를 이어서 볼것으로  
예상하고 말하는듯하다.
>
> 만약 못보았다면 [authentication](https://docs.nestjs.com/security/authentication) 챕터를 보라고 설명한다.

이 예시가 작동하려면 `User` class 는 아래와 같이 되어야 한다고 한다.

```ts

class User {
  // ...other properties
  roles: Role[];
}

```

> 굳이 테스트까지는 하지 않고, 책의 내용을 좀더 이해하기 위해  
> 개념만 보고 넘긴다.
> 시간되면 나중에 `Docs` 도 하나씩 되짚기는 해야겠다.

마지막으로, `RolesGuard` 를 등록한다.
예를들어 `controller` 레벨 또는 `globally` 레벨에 등록한다  

```ts
providers: [
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
],
```

위 코드는 `globally` 레벨에 등록한것이다.
이제, `user` 의 요청이 `endpoint` 에서 불충분한 권한요청일때,  
`Nest` 에서 자동적으로 다음의 `response` 를 반환한다. 

```ts
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}

```

> ***HINT***
> 만약 다른 `error` 의 응답을 원한다면, `boolean` 값을 `return` 하지 말고,  
특정 예외를 `throw` 해야만 한다.

### Claims-based authrization

`ID` 가 생성되면, 아마도 믿을수 있는 당사자에 의해 하나 또는 여러 `claims` 를  
청구할수 있다.

`claim` 은 `name-value` 페어이며, 이것은 인증된 사용자(`subject`)가 할수있는 것이 무엇인지, 아닌지를 알려준다.

> `subject` 라는 말은 `주체`, `피실험자`, `주제` 등등의 많은 뜻으로 쓰인다.  
> 여기서는 `주체` 즉 실제 대상을 가리키며, 이는 `인증된 사용자` 로  
> 해석될수 있다.

`Nest` 의 `Claims-based authorization` 을 구현하려면, `RBAC` 섹션과  
비슷하지만 한가지 다른점이 있다.

지정된 `roles` 를 체크하는 대신, `permissions` 를 비교해야만 한다.
모든 유저는 일련의 `permissions`이 할당된다

마찬가지로, 각 `resource/endpoint` 는 어떤 `permission` 이 요구되는지  
정의하고 접근한다.

> 예를들어 전용 `@RequirePermissions()` 데커레이터를 통해서..

`cats.controller.ts`

```ts

@Post()
@RequirePermissions(Permission.CREATE_CAT)
create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}

```

> ***HINT***
> 위의 예시에는, `Permission`(`RBAC` 섹션에서 보여준 `Role` 과 비슷하다) 은  
> `Typescript` 의 `enum` 이다. 이 `enum` 은 `system` 안에서 활용가능한  
> 모든 `permissions` 를 포함한다.

### Integrating CASL

`CASL` 은 `isomorphic authorization library` 이다. 이 `CASL` 은 `castle` 로  
발음되기에 지어진 명칭이라 한다.  

이는 `resource` 에대한 `client` 의 접근 허용을 엄격히 제한하는 `javascript`  
라이브러리이다.

이 라이브러리는 점진적으로 적용가능하고, 간단한 `claim` 기반과  
모든 기능을 가진 인증된 유저 그리고 속성 기반 인가(`Authorization`) 사이에서  
쉽게 확장 할수 있다.

이 라이브러리는 `UI` 컴포넌트들, `API` 서비스, `DB query`를 오가며 권한을  
공유하며, 관리를 쉽게 만들어준다.

`CASL` 은 [Attribute Based Access Control](https://en.wikipedia.org/wiki/Attribute-based_access_control) 로 구현되었다고 한다.

```sh

\$ npm i @casl/ablility 

```

> ***HINT***
> 이 예시는, `CASL` 을 선택한다. 그러나 취향에 따라 `accesscontrol` 이나  
`acl` 같은 라이브러리를 사용할수 있다.

설치가 완려되면, `CASL` 의 메커니즘을 설명하기 위해 2개의 `entity` 클래스인  
`User` 와 `Article` 을 정의한다

```ts

class User {
  id: number;
  isAdmin: boolean;
}

```

`User` 클래스는 두개의 프로퍼티를 가진다. `id` 는 고유한 유저 식별자이고,  
`isAdmin` 은 `user` 가 관리자 권한을 가졌는지 아닌지를 가리킨다

```ts

class Article {
  id: number;
  isPublished: boolean;
  authorId: number;
}

```

`Article` 클래스는 `id`, `isPublished` 그리고 `authorId` 라는  
3개의 프로퍼티를 가진다.

`id` 는 `article` 의 유일한 식별자이고,  
`isPublished` 는 `article` 이 이미 `publishd` 인지 아닌지를 가리킨다.
그리고 `authorId` 는 `article` 을 쓴 사람의 `ID` 이다.

---

***이제, 예시를 위한 우리의 요구사항을 검토하고 개선해보자***

- `Admin` 은 모든 `entities` 를 `manage`(`CRUD`) 할수 있다
- `User` 는 모든것에 대한 `read-only` 접근을 가진다.
- `User` 는 자신의 `article` 을 `update` 할수 있다.(`article.authorId = userId`)
- 이미 게시된 `Article` 은 삭제할수 없다.

---

`Action` `enum` 을 생성하는것 부터 시작할수 있다.
`Action` `enum` 은 , 사용자 `entites` 에서 사용할 수 있는 모든 가능한  
`action` 을 보여준다

```ts

export enum Action {
  // manage 액션
  Manage = 'manage',
  // create 액션
  Create = 'create',
  // read 액션
  Read = 'read',
  // update 액션
  Update = 'update',
  // delete 액션
  Delete = 'delete',
}

```

> ***HINT***
> `manage` 는 `CASL` 에서 `any` 액션을 나타내는 특별한 키워드이다.

`CASL` 라이브러리를 캡슐화하려면, `CaslModule` 그리고 `CaslAbilityFactory` 를  
생성한다.

```ts

\$ nest g mo casl
\$ nest g class casl/casl-ability.factory

```

만들어진 `CaslAbilityFactory` 에서 `createForUser()` 메서드를 정의할수 있다.
이 메서드는 주어진 `user` 에 대한 `Ability` 객체를 생성할 것이다.

```ts

// Subjects type 을 만든다.
// typeof Article 또는 typeof User 의 subject 를 추정하는데 사용되는
// InferSubjects 를 사용한다.
// `union type` 으로 `all` 도 포함한다
type Subjects = InferSubjects<typeof Article | typeof User> | 'all';

// Ability 타입을 추정하기 위해 `Action` 과 `Subjects` 타입을
// 제네릭의 배열로 넣는다.
export type AppAbility = Ability<[Action, Subjects]>;

// provider 생성
@Injectable()
export class CaslAbilityFactory {
  // user 를 인자로 받고 이를 이용해서 `Ablility` 객체를 만드는
  // 메서드
  createForUser(user: User) {
    // AbilityBuilder 를 사용하여, can, cannot, build 를 구조분해할당한다
    const { can, cannot, build } = new AbilityBuilder<
      Ability<[Action, Subjects]>
    >(Ability as AbilityClass<AppAbility>);

    // user 가 admin 이라면
    if (user.isAdmin) {
      // 모든 권한에 대해 접근 가능하다
      can(Action.Manage, 'all'); // read-write access to everything
    } else {
      // 아니라면, 읽기만 가능하다
      can(Action.Read, 'all'); // read-only access to everything
    }

    // Article 의 Update 액션에 대해서 소유자의 { user.id } 가 
    // 맞다면 업데이트 가능하다. 
    can(Action.Update, Article, { authorId: user.id });
    // Article 의 Delete 액션은 이미 isPublished 가 true 가 된
    // article 이라면 삭제 불가능하다 
    cannot(Action.Delete, Article, { isPublished: true });
    // 처리한 내용을 build 한다
    return build({
      // 
      // Read https://casl.js.org/v6/en/guide/subject-type-detection#use-classes-as-subject-types for details
      //
      // `CASL` 은 `class` 를 사용하여 `backend` 에서 도메인 로직을
      // 모델링하는것이 일반적이다.
      // 그래서 `permission` 정의에서 `subject type` 으로 `class` 를  
      // 사용하기 원할 수 있다.
      // 이때 필요한것이 커스텀 `detachSubjectType` 이다.
      // 
      // `Typescript` 에서는 `issue` 로 인해 `object.constructor` 를  
      // cast 할 필요가 있다고 한다.
      // 
      // 여기서는 typeof 시 constructor 가 `function` 으로 나온다.
      // 내가볼때는 `subject` 로 사용되는 `class` 타입이어야 하는듯하다.abs
      // 이러한 타입문제로 인해 `casting` 해주는 듯 하다. 
      //
      // 굳이, 왜 detactSubjectType 을 사용하여 처리하는지 아직은 
      // 이해가 안간다.
      // 다른 방식으로 CASL 을 사용하는 예시가 있던데...
      // 뭐.. Docs 의 예시이니 그냥 넘어간다.
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}

```

> ***NOTICE***
> `all` 은 `CASL` 에서 `any subject` 를 나타내는 특별한 키워드이다.
>
> ***HINT***
> `Ability`, `AbilityBuilder`, `AblilityClass` 그리고 `ExtractSubjectType` 은  
> `@casl/ablility` 패키지로 부터 `export` 된 클래스이다.
>
> ***HINT***
> `detachSubjectType` 옵션은 `CASL` 이 객체에서 `subject type` 을 어떻게  
가져오는지 방법을 이해할 수 있다.
> [CASL documentation](https://casl.js.org/v6/en/guide/subject-type-detection#use-classes-as-subject-types) 에서 더 자세한 정보를 볼 수 있다.
>
> 내가 이해한 내용으로는 `detachSubjectType` 은 `subjectType` 이 무엇인지  
> 결정하는 함수이며, 타입이 다음처럼 생겨먹었다.

```ts
detachSubjectType(subject: any): SubjectType;
```

> 그러므로 `subject` 부분이 무엇이냐에 따라, 해당 타입을 반환한다.
> 현재 위의 예시는 `class` 를 `subject` 타입으로 처리하고 있으니  
> 해당 `class` 타입을 내보내야 한다.
>
> 그러므로, 커스텀하게 `subjectType` 을 감지하여 내보내도록 처리해주는
> 로직이라고 생각해도 될것 같다.

이 예시에서, `AbilityBuilder` 클래스를 사용하여 `Ability` 인스턴스를  
만들었다. 구조분해할당한 `can` 그리고 `cannot` 은 같은 인자를 받기도하지만,  
다른 의미를 가진다.

`can` 은 지정된 `subject` 에 대한 `action` 이 동작하도록 허용하고,  
`cannot` 은 접근하지 못하게 막는다.

둘다 4개의 인자를 허용하며, 이에 대해서는 [CASL documentation](https://casl.js.org/v6/en/guide/intro) 을 방문해서 배우도록 하라고 한다.

> 대략적인 내용을 보니까,
> `User Action`, `Subject`, `Fields`, `Conditions` 이렇게 4개의 인자를  
> 받는다고 나와있다.
> **`Action`** 은 `CRUD` 액션을 말하고,
> **`Subject`** 는 인가 가능한 주체를 말한다.
> **`fields`** 는 `해당 field` 에 대한 모든 권한을 부여한다.
> **`Conditions`** 는 추가적인 인자의 조건이 맞다면, 해당 `subject` 의 `Action` 을 허용한다.

이제 마지막으로, `CaslAbilityFactory` 를 `CaslModule` 의 `providers` 와  
`exports` 의 배열에 넣어준다.

```ts

import { Module } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory';

@Module({
  providers: [CaslAbilityFactory],
  exports: [CaslAbilityFactory],
})
export class CaslModule {}

```

이제 더불어 `CaslModule` 을 `host context` 에서 가져오는한  
`CaslAbilityFactory` 를 사용할 `class` 의 `contructor` 에 주입할수  
있다.

```ts
constructor(private caslAbilityFactory: CaslAbilityFactory) {}
```

그때, 다음처럼 사용한다.

```ts
const ability = this.caslAbilityFactory.createForUser(user);
if (ability.can(Action.Read, 'all')) {
  // "user" has read access to everything
}
```

예를 들어서, `user` 가 `admin` 이 아닌경우, 이 `user` 는 `article` 을  
읽을수있지만, 새로운것을 생성하거나, 존재하는 `article` 을 삭제하지 못하게  
금지 되어야 한다.

```ts

const user = new User();
user.isAdmin = false;

const ability = this.caslAbilityFactory.createForUser(user);
ability.can(Action.Read, Article); // true
ability.can(Action.Delete, Article); // false
ability.can(Action.Create, Article); // false

```

또한, 요구사항에 정한것 처럼, `user` 는 자신의 `article` 을  
`update` 할수있어야만 한다

```ts

const user = new User();
user.id = 1;

const article = new Article();
article.authorId = user.id;

const ability = this.caslAbilityFactory.createForUser(user);
ability.can(Action.Update, article); // true

article.authorId = 2;
ability.can(Action.Update, article); // false

```

`Ability` 인스턴스는 꽤 읽기 쉬운 방법으로 `permissions` 체크를 하고있다.
마찬가지로, `AbilityBuilder` 는 비슷한 방식으로 `permissions` 정의하고,  
다양한 조건을 지정 할 수있다

### Advanced: Inplementing a policiesGuard

이 섹션에서, 좀더 정교한 `guard` 를 만드는 방법에대해 보여주도록 한다
만약 `user` 가 특정 `authorization` 정책을 만난다면, `method-level` 에서  
설정할 수 있다. (`class-level` 에서 역시 정책을 설정을 확장 할수도 있다.)

이번 예시에서, `CASL` 패키지를 단지 보여주기위한 목적으로 사용하지만,  
이 라이브러리가 필수적이지는 않다

또한 `CaslAbilityFactory` 는 이전 섹션에서 이미 생성했으므로,  
`CaslAbilityFactory` 를 사용할 것이다.

첫번째로, 요구사항을 구체화 시켜본다.
목표는 경로 핸들러별로 정책 검사를 지정할 수 있는 메커니즘을 제공하는것이다.

객체 그리고 함수들 모두 지원한다.
(간단하게 검사하고, 좀더 함수형 스타일의 코드를 제공하기 위해)

정책 핸들러를 위한 `interface` 정의 부터 시작해보자

```ts

// AppAility 타입을 가져옴
import { AppAbility } from '../casl/casl-ability.factory';

// 정책 핸들러 인터페이스
interface IPolicyHandler {
  // ablility 로 AppAbility 를 받으며, booelan 을 리턴하는 함수
  handle(ability: AppAbility): boolean;
}

// 정책 핸들러 콜백함수의 타입
type PolicyHandlerCallback = (ability: AppAbility) => boolean;

// 정책핸들러의 타입을 함수와 객체로 처리하기 위해
// 유니온 타입으로 타입지정
export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;

```

`policy handler` 를 지정하기 위한  
`object` (`IPolicyHandler` 인터페이스로 구현한 `class` 의 인스턴스) 와  
`function` (`PolicyHandlerCallback` 인 함수타입) 인 두개의 가능한 방법을 제공한다

이곳에 추가적으로 `@CheckPolicies()` 데커레이터를 생성할 수 있다.
이 데커레이터를 사용하면 지정한 리소스에 접근을 위해 충족해야 하는 정책을  
지정할 수 있다.

```ts

export const CHECK_POLICIES_KEY = 'check_policy';
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);

```

`PoliciesGuard` 를 생성하고, 이 `guard` 는 `route handler` 에  
바인드된 모든 `policy handlers` 를 추출하고 실행할것이다.

```ts

@Injectable()
export class PoliciesGuard implements CanActivate {
  // reflector, caslAbilityFactory 주입
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // policyHandlers 를 `route handler` 에서 get
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    // request 객체에서 `user` 객체를 가져옴
    const { user } = context.switchToHttp().getRequest();
    // caslAbilityFactory 에서 createForUser 를 사용하여,
    // ability 인스턴스 생성
    const ability = this.caslAbilityFactory.createForUser(user);

    // policyHandlers 를 순회하며 handler 실행
    return policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability),
    );
  }

  // policyHandler 를 받아 실행시킬 메서드
  private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
    // handler 가 함수라면 함수 실행
    if (typeof handler === 'function') {
      return handler(ability);
    }
    // 함수가 아니라면, handler 내부 메서드인 handle 실행
    return handler.handle(ability);
  }
}

```

`policyHandlers` 는 `@CheckPolicies()` 데커레이터를 통한 메서드로부터  
할당된 `handlers` 의 배열이다.

다음으로, `CaslAbilityFactory#create` 메서드를 사용한다. 이 메서드는 `Ability` 객체를 생성하며, 지정된 액션을 수행할 능력이 있는 `permissions`  
를 가졌는지에 대한 검사를 하는 객체이다

이 객체 `policy handler` 에 전달하며, 이 `policy handler` 는 함수이던가 `IPolicyHandler`로 구현된 클래스의 인스턴스일 것이다.

`IPolicyHandler` 로 구현된 클래스라면, `boolean` 값을 반환하는  
`handle()` 메서드를 노출시켜 실행시킨다

마지막으로, `Array#every` 메서드를 통해 모든 `handler` 가 `ture` 값을  
반환했는지 확인하다.

마지막으로, `guard` 를 테스팅한다. `route handler` 를 통해 바인드하고,  
`policy handler` 를 등록한다.

```ts
@Get()
@UseGuards(PoliciesGuard)
@CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Article))
findAll() {
  return this.articlesService.findAll();
}
```

`policy handler` 에 `IPolicyHandler` 인터페이스로 구현된 클래스를 정의해본다

```ts

export class ReadArticlePolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.Read, Article);
  }
}

```

그리고 다음처럼 사용한다

```ts

@Get()
@UseGuards(PoliciesGuard)
@CheckPolicies(new ReadArticlePolicyHandler())
findAll() {
  return this.articlesService.findAll();
}

```

이로써 `Authorization` 에 대한 `Docs` 에 대한 내용정리가 끝났다.
실상 `CASL` 로 구현하면서 이해하는데 약간의 어려움이 있기는 하다.
추가적으로 다시한번 보면서 처리해보아야 겠다.
이제 책에 대한 내용으로 돌아가서 내용을 살펴보도록 하자. 


