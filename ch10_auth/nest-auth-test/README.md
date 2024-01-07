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

