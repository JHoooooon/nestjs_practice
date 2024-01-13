# 10.1 실습용 프로젝트 설정

현재 프로젝트에서는 `UserModule` 과 `AuthModule` 두개로 나누어 처리한다.
`AuthModule` 에서는 인증 및 인가 관련 로직을 처리하고,  
`UserModule` 은 회원 가입 및 유효성 검사에대한 로직을 처리한다

`user module 생성`

```sh

nest g mo user;
nest g co user --no-spec; // test 코드를 생성하지 않고 controller 생성
nest g s user --no-spec; // test 코드 생성하지 않고 service 생성

```

이렇게 하면 `src` 및에 `user` 폴더가 생기며, `user.module.ts` 및  
`user.controller.ts`, `user.service.ts` 가 생성된다.

이 챕터에서는 `SQLite` 를 사용한다고 한다.
`ORM` 을 지원하는 라이브러리를 사용해서 `DB` 를 처리할것이다.

```sh
npm i sqlite3 typeorm @nestjs/typeorm;

```

이렇게 작성한 다음 `appModule` 에서 `imports` 해야 한다

```ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    UserModule,
    // typeOrmModule 을 import
    // forRoot 에서 options 설정
    TypeOrmModule.forRoot({
      type: 'sqlite', // db type
      database: 'nest-auth-test.sqlite', // sqlite 의 database
      entities: [], // typeorm 에서 @Entity 데커레이터를 사용한
                    // entity 클래스를 담은 배열 
      synchronize: true, // 서버가 엔티티 객체를 읽어서 db 에 스키마를 생성
                         // 서버의 entity 코드가 변경되면 db 에 그대로 반영된다.
                         // dev 전용으로 사용
      logging: true,  // `SQL` 실행로그 확인
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

```

## 엔티티 만들기

유저 엔티티는 데이터베이스 테이블과 1:1 로 매칭되는 객체이다
작성할 유저 엔티티는 `id`, `email`, `password`, `createdDt` 속성이다

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
  // 컬럼
  @Column()
  password: string;
  // 컬럼
  @Column()
  username: string;

  // type 이 datetime 인 컬럼
  // 기본값을 넣어준다
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdDt: Date = new Date();
}

```

이제 `UserService` 를 생성한다.

```ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; // repository 주입 helper 데커레이터
import { User } from './user.entity'; // User 엔티티
import { Repository } from 'typeorm'; // typeorm Repository 타입

@Injectable()
export class UserService {
  constructor(
    // User Repository 를 주입
    // userRepository 의 타입은 typeorm 의 Repository<User>
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}
}

```

`Reposityr<Entity>` 에서 자주 사용하는 `API` 는 다음과 같다

| method | 설명 |
| :--- | :--- |
| find | `SQL` 에서 `select` 와 같은 역할 <br/> `find(condition?: FindConditions<Entity>): Promise<Entity[]>` |
| findOne | 값을 하나만 찾을때 사용 <br/> - `findOne(id?: string \| number \| Date \| ObjectID, options?: FindOneOptions<Entity>)` <br/> - `findOne(options?: FindOneOptions<Entity>)` <br/> - `findOne(conditions?: FindConditions<Entity>, options?: FindOneOptions<Entity>)` |
| findAndCount | `find` 로 쿼리해오는 객체와 더불어 엔티티의 갯수가 필요한 상황에서 사용 <br/> `findAndCount(options?: FindManyOptions<Entity>)` <br/> `findAndCount(conditions?: FindConditions<Entity>)` <br/> - 반환값: `promise<[Entity[], number]>` |
| create | 새로운 엔티티 인스턴스를 생성 <br/> `user.create()` |
| update | 엔티티의 일부를 업데이트할때 사용, 조건과 변경해야 하는 엔티티값에 <br/> 대해 업데이트 쿼리를 실행한다 <br/> `update(조건, Partial<Entity>, 옵션)` |
| save | 엔티티를 데이터베이스에 저장, 엔티티가 없으면 `insert` 하고 있으면 `update` <br/> `save<T>(entities: T[])` |
| delete | 엔티티가 데이터베이스에 있는지 체크하지 않고 조건에 해당하는 `delete` 쿼리 실행 <br/> `delete(조건)` <br/> - 반환값 `Promise<DeleteResult>` |
| remove | 받은 엔티티를 데이터베이스에서 삭제 <br/> `remove(entity: Entity)` <br/> `remove(entity: Entity[])` <br/> - 반환값 `Promise<Entity[]>`

유저 컨트롤러를 생성하는데, 해당 컨트롤러는 다음과 같다

- ***`/user/create`*** : 생성
- ***`/user/getUser/{:email}`*** : 읽기
- ***`/user/update`*** : 업데이트
- ***`/user/delete`*** : 삭제

이제 이러한 정보를 통대로 `UserController`, `UserService`, `UserRepository` 를  
생성한다.

`user.controller.ts`

```ts

import { User } from './user.entity';
import { UserService } from './user.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

// user 컨트롤러 생성
@Controller('user')
export class UserController {
  // userService 주입
  constructor(private readonly userService: UserService) {}

  // user 를 찾는 route
  @Get('/getUser/:email')
  // param 을 email 로 받음
  async findUser(@Param('email') email: string) {
    // email 을 사용하여 user 를 찾는다
    const user = await this.userService.findUser(email);
    // 해당 user 반환
    return user;
  }

  // user 를 생성
  @Post('/create')
  // user boyd 를 받는다
  async createUser(@Body() user: Omit<User, 'id' | 'createdDt'>) {
    // user 생성 호출 및 반환
    return await this.userService.createUser(user);
  }

  // user 를 업데이트
  @Patch('/update/:email')
  // param 으로 email 을 받으며, body 로 업데이트할 user 객체를 받는다
  async updateUser(
    @Param('email') email: string,
    @Body() user: Pick<User, 'username' | 'password'>,
  ) {
    // user 업데이트 호출 및 반환
    return await this.userService.updateUser(email, user);
  }

  // user 삭제
  @Delete('/delete/:email')
  // param 으로 email 을 받는다
  async deleteUser(@Param('email') email: string) {
    // deleteUser 호출 및 반환
    return await this.userService.deleteUser(email);
  }
}

```

`user.service.ts`

```ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; // repository 주입 helper 데커레이터
import { User } from './user.entity'; // User 엔티티
import { Repository } from 'typeorm'; // typeorm Repository 타입

@Injectable()
export class UserService {
  constructor(
    // User Repository 를 주입
    // userRepository 의 타입은 typeorm 의 Repository<User>
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  // user 생성  
  async createUser(user: Omit<User, 'id' | 'createdDt'>): Promise<User> {
    return this.userRepository.save(user);
  }

  // user 찾기 
  async findUser(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email } });
  }

  // user 업데이트
  async updateUser(
    email: string,
    _user: Pick<User, 'username' | 'password'>,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    user.username = _user.username;
    user.password = _user.password;
    // save 메서드를 사용하여, db 에 저장
    // 만약 user 가 존재한다면 `update` 되고
    // 아니라면 `insert` 된다
    return this.userRepository.save(user);
  }

  // user 삭제
  async deleteUser(email: string) {
    // delete 한다.
    // `deletedResult` 를 반환한다
    // `remove` 는 `remove` 된 `entity` 를 반환한다.  
    return this.userRepository.delete({ email });
  }
}

```

이제 `UserModule` 에 사용할 `entity` 의 기능을 `import` 해주어야 한다
여기서 `TypeOrmModule.forFeature` 를 사용하며, 이는 `TypeOrm` 의  
`Dynamic Module` 을 사용하여 `RepositoryService` 를 주입하는 역할을 한다.

```ts

import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

```

그리고, `AppModule` 에서 사용할 `Entity` 를 등록해야 한다.
그래야 `TypeOrmModule` 의 `rootModule` 에서 제공된 `entity` 를  
사용하여 생성할 `DB` 를 초기화 한다.

## Pipe 로 유효성 검증

그럼 문제가 발생한다.
만약, 클라이언트로 인해 유효하지 않은 값을 받으면 처리를 해주어야 한다.
유효하지 않은 값을 그대로 처리하면, 그건 그것대로 문제가 생기기 마련이다.

이러한 문제를 해결하기 위해, `Validation Pipe` 를 사용한다.
`Pipe` 란, [Request LifeCycle](https://docs.nestjs.com/faq/request-lifecycle) 에서 `Controller` 의 `router` 를 실행하기전에 실행한다.

`Pipe` 는 여러 상황에서 사용된다. 이 예시에서는 `router` 를 실행하기전에  
받은 `request.body` 객체의 값이 유효한 값인지 확인하는 역할을 한다.

`Pipe` 는 말대로, 물을 흘려보내는 배수관처럼 데이터의 흐름을 받아 처리한다.

`Validation Pipe` 을 사용하기 위해 `class-validator` 와 `class-transformer` 를 의존한다.

다음의 `package` 를 설치한다.

```sh

npm i class-validator class-transformer;

```

[class-transformer](https://www.npmjs.com/package/class-transformer) 는 `JSON` 객체 및 일반 객체를 어떤 `class` 의 인스턴스로 변환 시키거나 그 반대의 처리도 가능하다.

여기서는 `JSON` 객체를 받아서, 유효성 검사할 `class` 의 `instance` 와 같다면,  
해당 `router` 의 `request.body` 값으로 넘겨준다.

[class-validator] 는 `decorator` 및 `non-decorator` 기반의 유효성 검사를  
사용할 수 있다.

이는 `class` 의 `field` 에 `decorator` 를 사용하여, 유효성 검사를 한다.
아래는 `class-validator` `docs` 에 있는 내용이다.

```ts

import {
  validate,
  validateOrReject,
  Contains,
  IsInt,
  Length,
  IsEmail,
  IsFQDN,
  IsDate,
  Min,
  Max,
} from 'class-validator';

export class Post {
  @Length(10, 20)
  title: string;

  @Contains('hello')
  text: string;

  @IsInt()
  @Min(0)
  @Max(10)
  rating: number;

  @IsEmail()
  email: string;

  @IsFQDN()
  site: string;

  @IsDate()
  createDate: Date;
}

let post = new Post();
post.title = 'Hello'; // should not pass
post.text = 'this is a great post about hell world'; // should not pass
post.rating = 11; // should not pass
post.email = 'google.com'; // should not pass
post.site = 'googlecom'; // should not pass

validate(post).then(errors => {
  // errors is an array of validation errors
  if (errors.length > 0) {
    console.log('validation failed. errors: ', errors);
  } else {
    console.log('validation succeed');
  }
});

validateOrReject(post).catch(errors => {
  console.log('Promise rejected (validation failed). Errors: ', errors);
});
// or
async function validateOrRejectExample(input) {
  try {
    await validateOrReject(input);
  } catch (errors) {
    console.log('Caught promise rejection (validation failed). Errors: ', errors);
  }
}

```

위에서 `new Post()` 를 사용해서, `post` 의 인스턴스를 만들고, `field` 의  
값을 넣어준다.

이후, `validate` 함수를 사용하여 `field` 의 값을 검사한다.
만약 유효하지 않다면, `catch` 로 받아서 에러를 처리한다.

`ValidationPipe` 는 많은 `option` 들이 존재한다.
아래는 `validationPipeOptions` 은 다음과 같은 타입으로 이루어져 있다.

```ts

export interface ValidationPipeOptions extends ValidatorOptions {
  transform?: boolean;
  disableErrorMessages?: boolean;
  exceptionFactory?: (errors: ValidationError[]) => any;
}

```

이를 보면 알겠지만, `ValidationPipeOptions` 는 `ValidatorOptions` 를 그대로  
상속하고 있다.

`ValidatorOptions` 는 다음의 옵션들이 존재한다.

### validatorOptions

> [validatorOptions](https://docs.nestjs.com/techniques/validation#using-the-built-in-validationpipe) 에서 확인가능하다.

| Option | Type | Description |
| :--- | :--- | :--- |
| enableDebugmessage | `boolean` | 만약 `true` 라면, `warning` 메시지를 <br/> 출력한다. |
| skipUndefinedProperties | `boolean` | 만약 `true` 라면, `property` <br/> 값이 `undefined` 이면 `skip` 한다 |
| skipNullProperties | `boolean` | 만약 `true` 라면, `property` 가 <br/> `null` 이라면 `skip` 한다 |
| skipMissingProperties | `boolean` | 만약 `true` 라면, `property` 가 <br/> `null` 또는  `undefined` 일때 `skip` 한다. |
| whitelist | `boolean` | 만약 `true` 라면, `validation decorator` 를 <br/> 사용하지 않은 모든 프로퍼티들을 제거한다. <br/><br/> `class-validator` 는 검증시, 검증 규칙이 정의 되어있지 않은 프로퍼티가 있더라도 오류없이 그대로 <br/> 통과시킨다. `whitelist` 를 사용하면 정의되지 않은 프로퍼티는 제거하고, 작성된 프로퍼티만 리턴한다.|
| forbidNonWhitelisted | `boolean` | 만약 `true` 라면, `non-whitelist` 된 프로퍼티<br/> 를 제거하는 대신에, 예외를 던진다. |
| forbidUnknownValues | `boolean` | 만약 `true` 라면, `unknown` 객체를 검사하려고 시도하면 즉각적으로 실패한다 <br/><br/> 기본적으로 `class-validator` 는 검증을 수행할때 <br/> 대상 객체에 `unknown` 객체가 포함되더라도 오류 없이 통과시킨다.<br/><br/> 이는 `null`, `undefined` 도 포함한다. 둘다 타입이 없는 값이기에 이들을 <br/> `class-validator` 는 `unknown` 객체로 처리한다|
| disableErrorMessages | `boolean` | 만약 `true` 라면, 검증 에러는 <br> `client` 로 리턴되지 않는다 |
| errorHttpStatusCode | `number` | 이 설정은 `error` 가 발생한 경우 예외타입을 지정할 수 있다. <br/> 기본값으로 `BadRequestException` 가 설정되어 있다. |
| exceptionFactory | `function` | 검증 에러의 배열을 가져와서, 던질 예외 객체를 리턴한다. |
| groups | `string[]` | 객체를 검증하는 동안 사용될 `group` 들 이다. <br/> 기본적으로 `class-validator` 는 모든 데커레이터에 대해 검증을 수행한다. <br/> `groups` 옵션을 사용하면 특정 그룹에 속한 데커레이터에 대해서만 검증을 수행한다.<br/><br/>`class-validator` 에서는 사용할 검증 데커레이터에 옵션 객체중 `groups` 프로퍼티가 있다. <br/><br/> 이를 사용하여 지정할 `groups` 배열에 <br/> `group` 명을 지정하고, 이 옵션상에 사용하면 지정된 `group` 만 검증하게 된다.|
| always | `boolean` | 데커레이터의 옵션을 `always` 로 `default` 설정한다. <br/> `class-validator` 는 객체의 프로퍼티에 데커레이터가 정의되어 있는 경우에만 검증을 수행한다. <br/><br/> 이말은 데커레이터가 정의되지 않으면 검증 수행을 안한다는 것이다. <br/><br/> `always` 는 객체의 프로퍼티에 데커레이터가 정의되어 있지 않더라도 <br/> 모든 데커레이터에 대해 검증을 수행한다.<br/><br/>`객체의 모든 필드를 검증해야 할때` 혹은 `데커레이터가 정의되어 있지 않은 필드에도 검증을 해야 할때` 사용한다. |
| strictGroups | `boolean` |`class-validator` 는 그룹지정이 없는 데커레이터에도 검증을 수행한다. <br/><br/> `strictGroups` 옵션을 설정하면, 그룹 지정이 없는 데커레이터에 대해서는 검증을 수행하지 않게 된다 |
| dismissDefaultMessage | `boolean` | 만약 `true` 라면, 이 검증은 기본 메시지를 사용하지 않는다. <br/><br/> 만약 명시적으로 설정하지 않는다면, 에러 메시지는 항상 `undefined` 일 것이다. |
| validationError.target | `boolean` | 만약 `ValidationError` 내부에 `target` 를 노출해야 하는지 여부를 나타낸다  |
| validationError.value | `boolean` | 만약 `ValidationError` 내부에 `value` 를 노출해야 하는지 여부를 나타낸다 |
| stopAtFirstError | `boolean` | `true` 일때, 첫번째 `error` 가 발생하자마자 검증을 중단하는 옵션이다 <br/><br/> 기본값은 `false` 이다.<br/><br/> 모든 오류를 수집하는 것 보다 첫 번째 오류를 신속하게 파악하는 것이 중요하거나, 검증 오류가 많아서 성능에 부담이 되는 경우 사용한다. |

> ***NOTICE***
> 더 많은 정보를 보고 싶다면 [class-validator](https://github.com/typestack/class-validator) 를 보라고 한다.

그럼 첫번째로 `Auto-validation` 이라고 해서, `globalPipe` 를 설정해본다.
이는 전역설정해서 자동적으로 `validation` 설정하는 방법이다.

`main.ts`

```ts

import { validationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // useGlobalPipes 메서드를 사용하여, 전역 설정한다.
  // 이때, `validationPipe` 를 전역 pipe 로 등록한다
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}

bootstrap();

```

이는 전역적으로 사용한 `pipe` 를 설정하므로, `bootstrap` 의 `app` 에서  
설정한다.

이는 `rootModule` 을 사용해서 생성된 `app` 에 지정하므로, 모든 `module` 에서  
사용되는 `pipe` 이다.

이후 사용할 `UserDto` 를 만든다.

`user.dto.ts`

```ts

import { IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  username: string;
}

export class UpdateUserDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}


```

이렇게 만든 `dto` 는 `class-validator` 로 유효성 검사할 목적이며,  
받은 `payload` 의 `type` 을 지정하는데 사용한다.

이렇게 만든 `dto` 는 당연 `controller` 와 `service` 에 사용한다.

`user.controller.ts`

```ts

  // user 를 생성
  @Post('/create')
  // user boyd 를 받는다
  async createUser(@Body() user: CreateUserDto) {
    // user 생성 호출 및 반환
    return await this.userService.createUser(user);
  }

  // user 를 업데이트
  @Patch('/update/:email')
  // param 으로 email 을 받으며, body 로 업데이트할 user 객체를 받는다
  async updateUser(@Param('email') email: string, @Body() user: UpdateUserDto) {
    // user 업데이트 호출 및 반환
    return await this.userService.updateUser(email, user);
  }


```

`user.service.ts`

```ts


  // user 생성
  async createUser(user: CreateUserDto): Promise<User> {
    return this.userRepository.save(user);
  }

  // user 업데이트
  async updateUser(email: string, _user: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    user.username = _user.username;
    user.password = _user.password;
    // save 메서드를 사용하여, db 에 저장
    // 만약 user 가 존재한다면 `update` 되고
    // 아니라면 `insert` 된다
    return this.userRepository.save(user);
  }

```

이제 인증을 처리해본다.
다음의 내용은 잘 정리된것 같아서 남겨본다

> 인증은 `정확성` 과 `시간 측면` 에서 사용자의 `자격증명` 을 확인하는 것이다.
>
> `정확성` 측면에서는 사용자의 자격증명을 기존 정보를 기반으로 확인 후
> `인증 토큰` 을 발급하는것을 말하며, `시간 측면` 에서는 사용자에게 부여된  
> `인증 토큰` 은 특정 기간 동안만 유효하다는 것을 말한다.

이렇게 처리하기 위해서는 대표적인 2가지 방식으로 구현한다.
하나는 `cookie` 로 처리하는 것이고, 하나는 `JWT` 토큰으로 처리하는 것이다.

#### cookie

`http` 는 `stateless` 하며, 이는 `state` 값을 저장하지 않는다는 것을 의미한다.

`stateless` 이므로, 기존의 정보를 저장하지 않고, `network` 통신이  
이루어지므로, `client` 의 `state` 를 `server` 에서 저장할 필요가 없다.  
이는 단순히 요청에 대한 응답만 수행하며, 이러한 상태 관리는 전적으로  
`client` 에 있다. 이는 `server` 에서 수행할 부담을 덜어주며, 책임을 분리하는  
좋은 방식이기도 하다.

이러한 방식은 대량의 트래픽이 발생하더라도 `server` 확장을 통해 대처하기에도  
수월하다고 한다.

> 서버 확장시 서버가 변경되어도 응답에 문제없이 작동하므로, 확장하는데도  
문제가 없다.

반면, `cookie` 는 보통 `statefull` 하다.
`stateless` 는 `state` 를 저장하지 않지만, `statefull` 은 그반대로  
`state` 를 저장한다.

`user` 로그인후, 서버에서는 해당 `user` 에 대한 정보를 저장하고 있어야 한다.
그래야 서버로 요청이 올때마다 해당 `user` 가 로그인한 `user` 인지 아닌지를  
알수 있기 때문이다.

`client` 단 입장에서 단순 `http` 를 사용하여 통신이 이루어지므로,
`stateless` 방식의 요청만 가능하다. (상태저장이 불가능하다)

이에 대한 필요성에 의해 `cookie` 라는 방법으로 이를 해결한다.
서버에서는 인증된 `client` 에 `cookie` 를 발급하여 전송한다.

그럼 `browser`에서는 해당 `cookie` 를 받고 이후, 매 요청시에  
`http body` 와 함께 `cookie` 를 포함하여 `server` 에 요청한다.

`server` 에서는 `cookie` 에 저장된 값을 사용하여, 인증된 `user` 정보가 저장된  
`session storage` 에서 값을 조회하고, 조회된 값을 사용하여, `user` 에 대한  
정보를 읽어 걸맞는 응답을 보낸다

즉, `cookie` 를 통해 `state` 를 저장하여 `server` 에서 처리한다는 것이다.

> 물론 과거에는 `cookie` 를 저장하여 보내는 방법밖에 존재하지 않았지만,  
현재는 `Modern storage APIs` 를 사용하여 다른방식으로 처리도 가능하다고 강조한다.

#### JWT token

`JWT` 는 `Json Web Token` 의 줄임말이다.
이는 `JSON` 객체 형태로 인증에 필요한 정보를 담은후 `secret key` 로  
`sign` 한 것이다.

이렇게 처리된것을 `token` 이라고 표현하는데, 뜻으로는 `표시`, `징표` 이다.
이는 `식별 을 위해 사용되는 것` 으로 해석할 수 있다.

즉, ***서버 간에 안정하게 정보를 주고 받기 위해 사용되는 암호화된 `JSON`*** 으로 식별을 위해 사용되는 `증표`라고 말할수 있을 듯 싶다.

`JWT` 토큰은 세부분으로 나누어진다.

- **Header**: 토큰의 종류, 인코딩 방식, 알고리즘에 대한 `metadata`
- **Payload**: 토큰에 포함된 데이터, 사용자의 `ID`, 권환, 만료시간등을 포함
- **Signature**: 토큰의 무결성을 보장하기 위한 서명

> `Signature` 는 `secret key` 를 사용하여 `Header` 와 `Payload` 값을  
> 암호화시킨 값이다. 이를 `sign(서명)` 했다고 한다.
>
> `Signature` 는 이후 `client` 의 요청시 포함된  
> `JWT` 의 `Header` 와 `Payload` 를 `secret key` 로 생성한 서명과 비교하여
> `JWT` 가 위조된 값인지 확인한다.

여기서 보면 `Payload` 가 존재하는것을 볼 수 있다.
이는 `Payload` 값에 식별가능한 사용자의 `ID` 값등의 여러 정보를 담아  
보낼수 있음을 볼 수 있다.

이 말은, `cookie` 없이 단순 `JWT` 로만으로도 `state` 값을 저장하여 보낼 수 있음을  
나타낸다

`Modern Browser` 에서는 `indexedDB`, `localStorage`, `sessionStorage` 등등의  
저장 가능한 `APIs` 를 지원한다.

> `Recoil`, `Redux` 등등 같은 `State Management Lib` 를 사용하면,  
이러한 전역 객체 관리 저장소에 저장해서 처리도 가능하다.

이러한 기본 저장소를 사용하여 `local` 상에 저장한후, 서버 요청시 같이 포함해서  
보내면 된다.

이 말은, `server` 에서 `session storage` 를 운용할 필요 없이 사용가능하므로,  
`stateless` 하다 어차피 `payload` 값에 사용할 `user` 정보가 같이 포함되어  
있기 때문이다.

> `Payload` 에 적재할 `data` 는 민감한 정보를 제외하고, 곡 필요한 정보만  
사용한다. `Payload` 값은 커지면 커질수록 요청시 네트워크 비용만 커질 수  
있다.
>
> 또한, `JWT` 는 `base64` 로 `decoding` 가능하므로, `payload` 값을  
누구든 확인 가능하다. 이렇게 확인 가능한 값에 민감한 정보를 포함하는건  
보안상 절대 좋지 않은 방법이다.

먼저 `Cookie` 먼저 사용해 보도록 한다.
먼저 `auth` 관련 `module`, `service`, `controller` 를 생성한다

```sh

nest g mo auth; # auth module 생성
nest g s auth --no-spec; # auth service 생성
nest g co auth --no-spec; # auth controller 생성

npm i bcrypt; # 가입 및 인증에 사용될 bcrypt 모듈
npm i -D @types/bcrypt; # bcrypt 를 typescript 에서 사용하기 위한 패키지

```

사용할 `routes` 는 다음과 같다.

- **/auth/register**: 회원가입
- **/auth/login**: 로그인
- **/auth/logout**: 로그아웃

`UserService` 를 `auth` 에서 사용해야 하므로, `exports` 하고,  
`AuthModule` 에서 `imports` 한다

`user.module.ts`

```ts

import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}


```

`auth.module.ts`

```ts

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule], // userModule 을 가져온다.
                         // userService 를 사용할 것이다.
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}

```

각 `AuthController` 및 `AuthService` 에서 `register` 메서드를 생성한다.

`auth.controller.ts`

```ts

import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/user/user.dto';

@Controller('auth')
export class AuthController {
  // authService 주입
  constructor(private readonly authService: AuthService) {}

  // Post register 경로 생성
  @Post('/register')
  // user 를 생성할 dto
  async register(@Body() userDto: CreateUserDto) {
    // user 등록
    await this.authService.register(userDto);
  }
}


```

`auth.service.ts`

```ts

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
    const user = this.userService.findUser(userDto.email);

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
}

```

이제 `login` 서비스 및 컨트롤러를 생성해야 한다.

`auth.service.ts`

```ts

...
export class AuthService {
  ...

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

```

`auth.controller.ts`

```ts

...
export class AuthController {
  ...
  // user 로그인 경로 생성
  @Post('/login')
  // user: 로그인할 dto
  // res: response 객체
  async login(@Body() user: LoginUserDto, @Response() res) {
    // userInfo 객체 가져옴
    const userInfo = await this.authService.validateUser(
      user.email,
      user.password,
    );

    // userInfo 가 있다면,
    if (userInfo) {
      // res.cookie 생성
      //
      // cookie 명은 login
      // payload 값은 `userInfo` JSON
      // cookie options
      res.cookie('login', JSON.stringify(userInfo), {
        // httpOnly 는 false -> 브라우저 js 에서
        //                      cookie 접근 가능
        //                      보안상 좋지는 않다.
        httpOnly: false,
        // maxAge 는 7일로 설정, ms 로 계산되므로
        // 1000 * 60 * 60 * 24 * 7 로 계산된다.
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });
      // res 를 해당 message 와 같이 보낸다
      return res.send(userInfo);
    }
  }
}

```

이제 잘 작동하며, `cookie` 값을 `response` 에 포함하여 보낸다.

#### Guard 미들웨어 사용

`Nest.js` 에는 인등시에 `guard` 를 사용한다.
`guard` 는 반환값이 `boolean` 인데, `true` 이면,  
`router` 를 실행하고, `false` 이면 막는다.

말그대로, `방패` 같은 역할이다.
`Guard` 역시 `@Injectable()` 데커레이터를 사용하여  
생성하며, `CanActivate` 인터페이스로 구현해야 한다.

`CanActivate` 인터페이스는 `canActivate(context)` 메서드가  
있으며, 인자값으로 `context` 를 받는다.
이 `context` 는 현재 활성 컨텍스트(ExecutionContext) 객체이며, 요청에 대한 정보를 제공한다.

이를 이용하기 위해 `cookeie` 를 `parsing` 해야 한다.
그러기 위해 `cookie-parser` 를 `install` 한다

```sh

npm i cookie-parser;
npm i -D @types/cookie-parser;

```

`cookie-parser` 를 전역적으로 사용하기 위해 `bootstrap` 의 `app` 을  
사용하여 `cookie-parser` 를 적용한다.

`main.ts`

```ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser()); // cookieParser 적용
  await app.listen(3000);
}
bootstrap();

```

`cookieParser` 는 `cookie` 값을 `parsing` 하여 , `request` 의 `cookies`  
프로퍼티의 값으로 채운다

그러면 `request.cookies` 로 `cookie` 의 값을 읽을 수 있다.
이를 사용하여, `LoginGuard` 를 생성한다.

`LoginGuard` 의 역할은 단순하다.

1. `login cookie` 가 있다면, `true` 를 반환한다
2. `login cookie` 가 없다면, `authService.userValidate` 를 사용하여,  
`userInfo` 를 가져온다.
3. `userInfo` 가 없다면, `false` 를 반환한다.
4. `userInfo` 가 존재한다면, `request.user` 에 `userInfo` 값을 할당한다.
5. 아무 문제 없다면 `true` 를 반환한다.

이를 구현한 로직은 다음과 같다

`auth.guard.ts`

```ts
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

```

여기서 중요한 점은 2가지이다.

1. `cookies['login']` 값이 있다면 `login` 한 유저로 해당 `guard` 를  
통과시킨다. (`ture` 반환)

2. `cookies['login']` 이 없다면, 로그인한 유저가 아니므로,  
로그인할 유저이다. 그러므로, `validateUser` 를 사용하여 `user` 가  
맞는지 확인하고, `userInfo` 가 `null` 이면 통과 안되고, 아니면 통과된다.

`@Injectable()` 데커레이터가 있다면 `주입` 할수 있다는 것이다.
이제 `Guard` 를 적용해본다.

`Guard` 는 `Filter` 나 `Pipe` 보다 먼저 실행된다.

`auth.controller.ts`

```ts

...

@Controller('auth')
export class AuthController {

...

  // guard 확인
  @UseGuards(LoginGuard)
  @Post('login2')
  async login2(@Request() req, @Response() res) {
    console.log(req.cookies['login'], req.user);

    if (!req.cookies['login'] && req.user) {
      res.cookie('login', JSON.stringify(req.user), {
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });
      return res.send(req.user);
    }
    throw new HttpException('이미 로그인된 유저입니다.', HttpStatus.FORBIDDEN);
  }

  // guard 확인
  @UseGuards(LoginGuard)
  @Get('test-guard')
  async testGuard() {
    // 로그인되면 아래 글 리턴
    // `Guard` 에서 `Request.cookies['login']` 을 확인하며,
    // 없더라도, `password` 및 `email` 이 없으니 통과되지 않고,
    // 403 에러가 발생한다. (반환 값이 `false` 면 `403` 에러 발생)
    return '로그인된 때만 이글이 보입니다.';
  }
}

```

#### passport 와 session 을 사용한 인증 구현

쿠키만으로 인증하면, 위변조 및 탈취의 위험에서 자유롭지 못하다.
그래서 보안을 강화하기 위한 수단으로, 쿠키에 직접적인 정보를 주지  
않는것이다.

서버에 저장소를 만들고, 이 저장소는 객체처럼 `key`, `value`  
페어로 이루어져있다고 하자.

그럼 `key` 는 `secret key` 로 생성되는 임의의 랜덤한 문자열이고,  
`value` 는 `user` 의 정보이다.

그리고 `cookie` 에 값은 이렇게 생성된 `key` 값을 주면, `cookie` 을  
받을때마다, 해당 `key` 를 사용해서 저장소에 저장된 `user` 의 정보를  
가져올 수 있다.

이렇게 저장된 저장소를 보통 `session` 저장소라고 하며,
서버에서 정보를 저장하므로, 서버의 자원을 사용하는 단점이 있다.

그렇지만, 유저 정보를 중간자에 의해 탈취되어, `위조`, `변조` 할 수  
없으므로, 보안상 매우 좋은 방식이라고 볼 수 있다.

> 실상 `cookie` 를 사용한다면 `session 저장소` 와 같이 사용된다고  
보면 된다.

이를 단순하게 사용하기 위해 사용되는 라이브러리중 `passport` 가 존재  
한다.

#### passport 에 대해서

`passport` 에 대한 개념을 정리해보자.
`passport` 가 어떠한 원리로 동작하는지 이해하는게 중요하다.
`passport.js` 을 통해서 원리를 이해해본다.
이를 이해한다음 `Nest.js` 에서 어떠한 방식으로 `passport` 를  
사용하는지 알아본다.

##### passport 의 `authentication`

