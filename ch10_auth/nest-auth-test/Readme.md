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
      logging: true, // `SQL` 실행로그 확인
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

| method       | 설명                                                                                                                                                                                                                                                                |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| find         | `SQL` 에서 `select` 와 같은 역할 <br/> `find(condition?: FindConditions<Entity>): Promise<Entity[]>`                                                                                                                                                                |
| findOne      | 값을 하나만 찾을때 사용 <br/> - `findOne(id?: string \| number \| Date \| ObjectID, options?: FindOneOptions<Entity>)` <br/> - `findOne(options?: FindOneOptions<Entity>)` <br/> - `findOne(conditions?: FindConditions<Entity>, options?: FindOneOptions<Entity>)` |
| findAndCount | `find` 로 쿼리해오는 객체와 더불어 엔티티의 갯수가 필요한 상황에서 사용 <br/> `findAndCount(options?: FindManyOptions<Entity>)` <br/> `findAndCount(conditions?: FindConditions<Entity>)` <br/> - 반환값: `promise<[Entity[], number]>`                             |
| create       | 새로운 엔티티 인스턴스를 생성 <br/> `user.create()`                                                                                                                                                                                                                 |
| update       | 엔티티의 일부를 업데이트할때 사용, 조건과 변경해야 하는 엔티티값에 <br/> 대해 업데이트 쿼리를 실행한다 <br/> `update(조건, Partial<Entity>, 옵션)`                                                                                                                  |
| save         | 엔티티를 데이터베이스에 저장, 엔티티가 없으면 `insert` 하고 있으면 `update` <br/> `save<T>(entities: T[])`                                                                                                                                                          |
| delete       | 엔티티가 데이터베이스에 있는지 체크하지 않고 조건에 해당하는 `delete` 쿼리 실행 <br/> `delete(조건)` <br/> - 반환값 `Promise<DeleteResult>`                                                                                                                         |
| remove       | 받은 엔티티를 데이터베이스에서 삭제 <br/> `remove(entity: Entity)` <br/> `remove(entity: Entity[])` <br/> - 반환값 `Promise<Entity[]>`                                                                                                                              |

유저 컨트롤러를 생성하는데, 해당 컨트롤러는 다음과 같다

- **_`/user/create`_** : 생성
- **_`/user/getUser/{:email}`_** : 읽기
- **_`/user/update`_** : 업데이트
- **_`/user/delete`_** : 삭제

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

validate(post).then((errors) => {
  // errors is an array of validation errors
  if (errors.length > 0) {
    console.log('validation failed. errors: ', errors);
  } else {
    console.log('validation succeed');
  }
});

validateOrReject(post).catch((errors) => {
  console.log('Promise rejected (validation failed). Errors: ', errors);
});
// or
async function validateOrRejectExample(input) {
  try {
    await validateOrReject(input);
  } catch (errors) {
    console.log(
      'Caught promise rejection (validation failed). Errors: ',
      errors,
    );
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

| Option                  | Type       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| :---------------------- | :--------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| enableDebugmessage      | `boolean`  | 만약 `true` 라면, `warning` 메시지를 <br/> 출력한다.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| skipUndefinedProperties | `boolean`  | 만약 `true` 라면, `property` <br/> 값이 `undefined` 이면 `skip` 한다                                                                                                                                                                                                                                                                                                                                                                                                                |
| skipNullProperties      | `boolean`  | 만약 `true` 라면, `property` 가 <br/> `null` 이라면 `skip` 한다                                                                                                                                                                                                                                                                                                                                                                                                                     |
| skipMissingProperties   | `boolean`  | 만약 `true` 라면, `property` 가 <br/> `null` 또는 `undefined` 일때 `skip` 한다.                                                                                                                                                                                                                                                                                                                                                                                                     |
| whitelist               | `boolean`  | 만약 `true` 라면, `validation decorator` 를 <br/> 사용하지 않은 모든 프로퍼티들을 제거한다. <br/><br/> `class-validator` 는 검증시, 검증 규칙이 정의 되어있지 않은 프로퍼티가 있더라도 오류없이 그대로 <br/> 통과시킨다. `whitelist` 를 사용하면 정의되지 않은 프로퍼티는 제거하고, 작성된 프로퍼티만 리턴한다.                                                                                                                                                                     |
| forbidNonWhitelisted    | `boolean`  | 만약 `true` 라면, `non-whitelist` 된 프로퍼티<br/> 를 제거하는 대신에, 예외를 던진다.                                                                                                                                                                                                                                                                                                                                                                                               |
| forbidUnknownValues     | `boolean`  | 만약 `true` 라면, `unknown` 객체를 검사하려고 시도하면 즉각적으로 실패한다 <br/><br/> 기본적으로 `class-validator` 는 검증을 수행할때 <br/> 대상 객체에 `unknown` 객체가 포함되더라도 오류 없이 통과시킨다.<br/><br/> 이는 `null`, `undefined` 도 포함한다. 둘다 타입이 없는 값이기에 이들을 <br/> `class-validator` 는 `unknown` 객체로 처리한다                                                                                                                                   |
| disableErrorMessages    | `boolean`  | 만약 `true` 라면, 검증 에러는 <br/> `client` 로 리턴되지 않는다                                                                                                                                                                                                                                                                                                                                                                                                                     |
| errorHttpStatusCode     | `number`   | 이 설정은 `error` 가 발생한 경우 예외타입을 지정할 수 있다. <br/> 기본값으로 `BadRequestException` 가 설정되어 있다.                                                                                                                                                                                                                                                                                                                                                                |
| exceptionFactory        | `function` | 검증 에러의 배열을 가져와서, 던질 예외 객체를 리턴한다.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| groups                  | `string[]` | 객체를 검증하는 동안 사용될 `group` 들 이다. <br/> 기본적으로 `class-validator` 는 모든 데커레이터에 대해 검증을 수행한다. <br/> `groups` 옵션을 사용하면 특정 그룹에 속한 데커레이터에 대해서만 검증을 수행한다.<br/><br/>`class-validator` 에서는 사용할 검증 데커레이터에 옵션 객체중 `groups` 프로퍼티가 있다. <br/><br/> 이를 사용하여 지정할 `groups` 배열에 <br/> `group` 명을 지정하고, 이 옵션상에 사용하면 지정된 `group` 만 검증하게 된다.                               |
| always                  | `boolean`  | 데커레이터의 옵션을 `always` 로 `default` 설정한다. <br/> `class-validator` 는 객체의 프로퍼티에 데커레이터가 정의되어 있는 경우에만 검증을 수행한다. <br/><br/> 이말은 데커레이터가 정의되지 않으면 검증 수행을 안한다는 것이다. <br/><br/> `always` 는 객체의 프로퍼티에 데커레이터가 정의되어 있지 않더라도 <br/> 모든 데커레이터에 대해 검증을 수행한다.<br/><br/>`객체의 모든 필드를 검증해야 할때` 혹은 `데커레이터가 정의되어 있지 않은 필드에도 검증을 해야 할때` 사용한다. |
| strictGroups            | `boolean`  | `class-validator` 는 그룹지정이 없는 데커레이터에도 검증을 수행한다. <br/><br/> `strictGroups` 옵션을 설정하면, 그룹 지정이 없는 데커레이터에 대해서는 검증을 수행하지 않게 된다                                                                                                                                                                                                                                                                                                    |
| dismissDefaultMessage   | `boolean`  | 만약 `true` 라면, 이 검증은 기본 메시지를 사용하지 않는다. <br/><br/> 만약 명시적으로 설정하지 않는다면, 에러 메시지는 항상 `undefined` 일 것이다.                                                                                                                                                                                                                                                                                                                                  |
| validationError.target  | `boolean`  | 만약 `ValidationError` 내부에 `target` 를 노출해야 하는지 여부를 나타낸다                                                                                                                                                                                                                                                                                                                                                                                                           |
| validationError.value   | `boolean`  | 만약 `ValidationError` 내부에 `value` 를 노출해야 하는지 여부를 나타낸다                                                                                                                                                                                                                                                                                                                                                                                                            |
| stopAtFirstError        | `boolean`  | `true` 일때, 첫번째 `error` 가 발생하자마자 검증을 중단하는 옵션이다 <br/><br/> 기본값은 `false` 이다.<br/><br/> 모든 오류를 수집하는 것 보다 첫 번째 오류를 신속하게 파악하는 것이 중요하거나, 검증 오류가 많아서 성능에 부담이 되는 경우 사용한다.                                                                                                                                                                                                                                |

> **_NOTICE_**
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
> 문제가 없다.

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
> 현재는 `Modern storage APIs` 를 사용하여 다른방식으로 처리도 가능하다고 강조한다.

#### JWT token

`JWT` 는 `Json Web Token` 의 줄임말이다.
이는 `JSON` 객체 형태로 인증에 필요한 정보를 담은후 `secret key` 로  
`sign` 한 것이다.

이렇게 처리된것을 `token` 이라고 표현하는데, 뜻으로는 `표시`, `징표` 이다.
이는 `식별 을 위해 사용되는 것` 으로 해석할 수 있다.

즉, **_서버 간에 안정하게 정보를 주고 받기 위해 사용되는 암호화된 `JSON`_** 으로 식별을 위해 사용되는 `증표`라고 말할수 있을 듯 싶다.

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
> 이러한 전역 객체 관리 저장소에 저장해서 처리도 가능하다.

이러한 기본 저장소를 사용하여 `local` 상에 저장한후, 서버 요청시 같이 포함해서  
보내면 된다.

이 말은, `server` 에서 `session storage` 를 운용할 필요 없이 사용가능하므로,  
`stateless` 하다 어차피 `payload` 값에 사용할 `user` 정보가 같이 포함되어  
있기 때문이다.

> `Payload` 에 적재할 `data` 는 민감한 정보를 제외하고, 곡 필요한 정보만  
> 사용한다. `Payload` 값은 커지면 커질수록 요청시 네트워크 비용만 커질 수  
> 있다.
>
> 또한, `JWT` 는 `base64` 로 `decoding` 가능하므로, `payload` 값을  
> 누구든 확인 가능하다. 이렇게 확인 가능한 값에 민감한 정보를 포함하는건  
> 보안상 절대 좋지 않은 방법이다.

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
> 보면 된다.

이를 단순하게 사용하기 위해 사용되는 라이브러리중 `passport` 가 존재  
한다.

#### passport 에 대해서

`passport` 에 대한 개념을 정리해보자.
`passport` 가 어떠한 원리로 동작하는지 이해하는게 중요하다.
`passport.js` 을 통해서 원리를 이해해본다.
이를 이해한다음 `Nest.js` 에서 어떠한 방식으로 `passport` 를  
사용하는지 알아본다.

##### passport 의 `Middleware`

`Passport` 는 인증요청에 대한 웹 어프리케이션 미들웨어로써 사용된다.

미들웨어는 `Express` 내에서 대중적으로 사용되고 있으며, [Connect](https://github.com/senchalabs/connect) 라이브러리보다 좀더 작게 만들어진 버전이다.

이 미들웨어는 다른 웹 프레임워크를 쉽게 적용시킬수 있다.

다음은 `username` 과 `password` 와 함께 유저인증을 하는 `authenticate` 라우트에 대한 예제이다.

```ts
app.post(
  '/login/password',
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureMessage: true,
  }),
  function (req, res) {
    res.redirect('/~' + req.user.username);
  },
);
```

이 라우트를 보면, `passport.authenticate()` 는 미들웨어이다. 이 미들웨어는 요청을 인증한다.

`authenticate` 가 실패하면, `/login` 경로로  
`redirect` 시키고 실패메시지와 함께 응답한다.

`passport.authenticate` 의 첫번째 인자를  
보면 `local` 이라고 작성되어 있는데, 이는  
`authenticate` 시에 사용할 `passport` 의 `stratege` 이다.

#### Passport 의 `stratege`

`stratege` 는 요청인증을 담당한다. 이는 인증 메커니증을 구현하여  
수행하는 목적에 만들어졌다.

> `stratege` 는 `전략` 이라는 뜻을 가진것을 보면, 인증
> 매커니즘에 따라 사용 `전략` 이 달라지므로, 이름을 지은듯 하다.

인증 매커니즘은 요청시 식별제공자(`IdP(Identity Provider)`)  
나 패스워드같은 신원확인을 위한 증거(`assertion`)를 인코딩하는  
방법을 정의한다.

또한, 꼭 필요한 확인 및 자격증명을 위한 함수를 특정짓는다.
만약, 자격증명이 성공적으로 확인 되었다면, 이 요청은 인증된 것이다.

여러 인증 메커니즘과 그에 맞는 여러 `stratege` 가 있다.
`stratege` 는 분리된 패키지로 구분되었으므로, 반드시 인스톨하고,  
설정하고, 등록해야 한다.

```ts

npm install passport-local;

```

이는 `passport` 의 `local` 전략을 설치하는 것이다.
`local` 전략은 단순하게 `username` 과 `password` 를 통해서  
인증하는 방법이다.

이외에 여러 전략들이 존재하는데 이는 [Passport Stratege](https://www.passportjs.org/packages/) 에서 확인 가능하다.

이제 설치가 끝났으면 전략을 설정하는 과정이 필요하다.
설정하는 방법은 각 인증 메커니즘에 따라 여러가지이며, 그렇기에  
각 전략에 지정된 `docs` 를 참고해야만 한다.

여기서는 가장 간단한 하면 `local` 전략을 살펴본다.
보통 전략을 사용하면 공통의 패턴을 가지는데, 이는 다음과 같다.

```ts
var LocalStrategy = require('passport-local');

export const strategy = new LocalStrategy(function verify(
  username,
  password,
  cb,
) {
  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    function (err, user) {
      if (err) {
        return cb(err);
      }
      if (!user) {
        return cb(null, false, { message: 'Incorrect username or password.' });
      }

      crypto.pbkdf2(
        password,
        user.salt,
        310000,
        32,
        'sha256',
        function (err, hashedPassword) {
          if (err) {
            return cb(err);
          }
          if (!crypto.timingSafeEqual(user.hashed_password, hashedPassword)) {
            return cb(null, false, {
              message: 'Incorrect username or password.',
            });
          }
          return cb(null, user);
        },
      );
    },
  );
});
```

코드를 살펴보면, `LocalStrategy` 생성자는 함수 인자를 가진다.
이 함수는 `verify`로 명명지어진 함수이고, 많은 전략에서 공통적으로  
사용하는 패턴이다.

인증 요청일때, 이 전략은 요청객체에 포함된 자격증명을 구문분석한다.
그런 다음 자격증명에 속한 사용자를 결정하는 역할을 하는 `verify` 함수가 호출된다.

이를 통해 데이터 접근을 어플리케이션에 위임할 수 있다.

예시를 보면, `verfiy` 함수는 데이터베이스로 부터 유저 `record` 를 얻기위해 `SQL` 쿼리를 실행하고, 패스워드를 검사한 이후에 `record` 를  
다시 전략에 적용한다(`cb`함수).

> `passport` 문서상에서 `yielding the record back to the strategy,`
> 라고 하는데, 이게 `해당 레코드를 전략에 다시 적용한다`로 해석된다.  
> `cb` 로 값을 넣는 과정을 말하는것으로 이해된다.

따라서 유저 인증과 로그인 세션을 설정하게 된다.

`verify` 함수는 특정 전략에 따라 인증 매커니즘에 의존하는 파라미터를  
받는다.

이 인증매커니즘은 `password` 같은 공유 `secrets` 를 공유하며,  
`verfiy` 함수는 `user` 생성 그리고 자격 증명 생성에 대한  
책임을 가진다.

이 매커니즘은 암호화 인증을 제공하기 위해, 유저와 키를 생성한다.  
그 중 키는 자격증명시 암호를 확인하기 위해 사용될 것이다.

> 문서를 보면 유저와 키를 생성한다고 한다.
> 얼핏 보면 뭔말인가 싶지만 다음의 부분을 말한다.

```ts

 crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', function(err, hashedPassword) { ... }

```

> 여기에서, `hashed_password` 가 암호화 인증을 위해 제공되는 키라고  
> 보면 된다. 이 `hashed_password` 를 사용하여, 기존 `user.password` 와  
> 비교하여 맞으면 `cb(null, user)` 를 통해 `user` 값을 `callback` 으로  
> 보낸다.

여기서 `cb` 함수는 3가지의 상황을 표현할 수 있다.

```ts
cb(null, user); // 성공
cb(null, false); // 실패
cb(err); // 에러
```

`docs` 에서는 발생할 수 있는 두가지 실패 사례를 구별하는것이  
중요하다고 한다.

인증 실패는 악의적인 공격자로 부터 잘못된 자격 증명을 수신하더라도  
서버가 정삭적으로 작동하는 예산된 조건이지만, 서버가 비정상적으로  
동작하는 경우에는 내부 오류를 나타내기 위해 `err` 를 설정해야 한다.

이렇게 `strategy` 가 무엇인지 대략적으로 알게 되었다.
그럼 이제 해당 `strategy` 를 서버에 등록하도록 하자.

#### Register

전략을 생성했으면, `passport` 에 사용하겠다고 등록하는 과정이  
필요하다. 이를 위해 `use` 메서드를 사용하여 처리한다.

```ts
import passport from 'passport';
import { strategy } from '@/passport/local-strategy';

passport.use(startegy);
```

모든 전략에 대한 네이밍 컨벤션이 있는데, `package` 상의 이름은  
`passport-{name}` 방식의 이름으로 되어있다.

즉 `LocalStrategy` 는 `passport-local` 이다.
이제 전략에 대한 등록이 완료 되었으니, `authenticate` 미들웨어에  
위해 `'local'` 전략이 실행된다.

하지만 전략 실행이후에, `cookie` 및 `session` 을 처리해주어야  
한다.

#### sessions

웹 어플리케이션은 페이지에서 페이지를 탐색하면서 유저를 식별하는  
능력이 필요하다.

각 동일한 유저에 연관된 일련의 요청, 응답을 세션이라 한다.
`HTTP` 는 `stateless` 프로토콜이다. 이는 각 어플리케이션요청  
을 개별적으로 이해할수 있음을 의미한다. (앞전의 요청으로 부터의 상태정보 없이 사용가능하는 것이다.)

이는 로그인한 사용자에 대한 문제를 제기한다. 인증된 유저는  
어플리케이션 탐색시 이후 요청에 대해 기억되어야하기 때문이다.

> 참 번역을 하면서 공부하다 보면 뭔가 말이 꼬인다.
> 간단하게 말하면, 인증된 유저는 각 페이지 탐색시 다른 페이지로 이동하더라도 여전히 서버에서 기억하고 있어야 함을 의미한다.
> 만약 서버에서 기억 못한다면 해당 유저가 로그인된 유저인지 알지 못한다.
>
> 페이지 전환때마다 로그인 해야 한다면 짜증날 것이다.

이후의 내용은 간단하다. 이를 해결하기 위해 `cookie` 가 등장했으며,  
`stateless` 인 `HTTP` 통신을 `statefull` 하게 만들었다고 한다.  
이러한 `cookie` 가 보안상 문제가 있기에, `session` 저장소를  
사용하여 인증에 대한 유저 정보를 저장하고, `cookie` 에 저장된  
`key` 를 사용하여 저장된 값을 가져온다는 내용이다.

이를 위해 많이 사용되는 `express-session` 을 사용한다.

```ts
var session = require('express-session');

app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true },
  }),
);
```

이렇게 `session` 객체를 생성했고,
로그인 세션을 유지하려면, `session` 으로 부터 유저 정보를  
`serialize(직렬화)`, `deserialize(역직렬화)` 해야 한다.

> 직렬화는 데이터를 일련의 문자열이나 바이너리 데이터로 변환하는작업  
> 을 말한다. 이는 인증 결과를 직렬화시킨후 저장하기에 붙은 이름이다.
>
> 역직렬화는 직렬화된 데이터를 다시 원래의 데이터로 복원한다.

`local` 전략에서 `cb(null, user)` 로 넘긴 `user` 데이터를  
세션에 저장해야 하므로, `passport` 는 `serializeUer` 메서드를  
제공한다.

```ts
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user.id);
  });
});
```

`serializeUser` 는 로그인이 성공하면 `passport` 에 의해 호출된다.

`serializeUser` 는 세션에 저장할 데이터를 지정한다.
제공되는 `cb` 의 두번째 인자로 해당 데이터를 넣어주면, 세션 저장소에  
해당 내용일 직렬화되어 저장된다.

```ts
passport.deserializeUser(function (id, cb) {
  db.get('SELECT * FROM users WHERE id = ?', [id], function (err, user) {
    if (err) {
      return cb(err);
    }
    return cb(null, user);
  });
});
```

`deserializeUser` 는 `serializeUser` 이후에 실행되며,  
`cb(null, user.id)` 로 넘긴 `user.id` 값을 `id` 인자로 받는다.

> 이는 `session` 에 저장된, `id` 값을 가져온다고 보면된다.
> 실제로, `login` 된 이후에 `passport.session` 미들웨어를 실행하고,  
> 저장된 `session` 값이 있다면, `deserializeUser` 를 실행시킨다.

받은 `id` 인자는 `user` 를 조회하는데 사용되며, 이후에  
`cb(null, user)` 로 넘겨준다.
이와 동시에 `req.session` 에 저장된 로그인 정보를 `deserialize` 해서  
`req.user` 에 저장된다.

넘겨준 `cb` 는 `req.login` 에 넘겨준 콜백함수를 실행시킨다.

```ts
passport.authenticate('local', (authErr, user, info) => {
  if (authErr) {
    return next(authErr)
  }

  if (!user) {
    return res.redirect(`/?loginError=${info}`)
  }

  return req.login(user, function (err) {
    if (err) {
      return next(err);
    }
    return res.redirect('/users/' + req.user.username);
  });
});
```

> `passport.authenticate` 는 자동적으로 `req.login` 을 실행시킨다고  
> 한다. `authenticate` 자체에서 `req.login` 을 사용할수도 있다

#### `passport` 의 실행 흐름

대략 여기까지가 `passport` 의 흐름이다.
정리해보면 다음과 같다

```sh

-------------------------------
app.use(passport.initalize())

app 에 passport 를 초기화시켜 할당
-------------------------------
                |
                v
-------------------------------
app.use(passport.session())

passport 에서 생성된 user 정보를 
`session` 스토리지에 저장하는 역할
-------------------------------
                |
                v
-------------------------------------------------------------
app.use(new LocalStrategy((username, password, cb) => {... }))

passport 에 사용할 전략 설정 및 등록
여기서는 `local strategy` 사용
-------------------------------------------------------------
                |
                v
------------- 로그인전 ---------

-------------------------------------------------------------
app.post(
'login',
passport.authenticate('local', function verify (authErr, user, info) {...}),
(req, res) => {...})

login router 를 통해 `authenticate` 미들웨어 실행
-------------------------------------------------------------
                              |
                              v
-------------------------------------------------------------
`authenticate` 미들웨어 실행시 등록된 `local` 전략을 실행

앞전에 등록된 LocalStrategy 가 실행되며, 사용자 인증에 문제가 없다면
`cb(null, user)` 함수 실행

> 이것은 내 생각인데, cb 함수가 authneticate 에 넘겨준 콜백함수라는
생각이 든다. 물론 내부구조를 까보지는 않아서 모르겠지만, 아마도  
`authenticate` 에서 `req.body.username` 과 `req.body.password`, 그리고
`authenticate 의 verify` 함수를 사용하여 `LocalStrategy` 함수의 콜백함수인
(username, password, cb) => {...} 부분에 넘겨질 것이다. 

정리하면 다음과 같을것이다.

username = req.body.username
password = req.body.password
cb = autenticate 의 verify 함수

-------------------------------------------------------------
                              |
                              v
-------------------------------------------------------------
이렇게 `local strategy` 의 `cb` 함수가 실행이 된 이후에, 
`authenticate` 에서는 `req.login` 메서드를 지정하고 리턴한다.

router.post(
  '/login',
  # next 함수를 사용하기 위해 한번더 감싸준다.
  # 이는 authenticate 미들웨어를 미들웨어로써 한번더 감싼다.
  # 미들웨어 내의 미들웨어를 호출해야 하므로 해당 인자값을
  # 내부 미들웨어에 전달해야 한다.
  (req, res, next) => {
    passport.authenticate('local', (authErr, user, info) => {
      if (authErr) {
        return next(authErr)
      }
      if (!user) {
        return res.redirect(`/?loginError={info}`)
      }
      # req.login 함수를 실행
      return req.login(user, loginError => { ... }) 
    })(req, res, next);
  },
  (req, res) => {...}
)

중요한건 `authenticate` 함수 자체가 내부적으로 `req.login` 을 생성한다는 것이다.
`req.login` 은 두개의 인자를 받는다

- 첫번째 인자는 `user` 정보를 받는다
- 두번째 인자는 실행시킬 `callback` 함수를 받는다

-------------------------------------------------------------
                              |
                              v
-------------------------------------------------------------

req.login 호출하면, `serializeUser` 함수가 실행된다

`serializeUser` 는 `session` 객체에 저장될 값을 지정한다.

passport.serializeUser((user, cb) => {
  cb(null, user.id);
})

-------------------------------------------------------------
                              |
                              v
-------------------------------------------------------------

`session` 객체의 값이 변경된것을 감지하면, `deserializeUser` 가  
실행된다.

passport.deserializeUser((id, cb) => {
  User.findOne({ where: { id } })
    .then((user) => cb(null, user))
    .catch(err => done(err));
})

`deserializeUser` 함수의 `cb` 는 `req.user` 에 `user` 객체를 할당하는 함수이다.

-------------------------------------------------------------
                              |
                              v

-------------------------------------------------------------

다시 `req.login` 으로 돌아와서 사용된 콜백함수를 보자

return req.login(user, loginError => { ... }) 

보면 콜백으로 `loginError => {...}` 으로 넘겨주는것을 볼 수 있다.
`req.login` 호출이후 `deserializeUser` 함수 호출까지 마친다면
마지막으로 넘겨준 콜백함수가 실행된다.

이렇게 넘겨준 콜백함수를 사용하여, `error` 검증하고,
`redirect` 하거나, 찾은 `user` 정보를 `client` 로 보내주면 된다.

-------------------------------------------------------------
                              |
                              v

------------- 로그인 후 ---------

-------------------------------------------------------------

로그인 이후에는 로직이 단순해진다.

`passport.session()` 호출시, `req.session['sessionId']` 가 있다면,
`passport.deserializeUser` 를 자동 호출한다.

-------------------------------------------------------------
                              |
                              v
-------------------------------------------------------------

호출된 `passport.deserializeUser` 는 `req.user` 에 `user` 객체를
할당한다.

이로써, `req.user` 에 `user` 값이 존재하면, 로그인된 `user` 이고
아니라면, 로그인되지 않은 `user` 임을 알수 있다.

-------------------------------------------------------------
                              |
                              v
-------------------------------------------------------------

만약, 로그아웃을 하고 싶다면, `req.logout` 을 호출하면 된다.

-------------------------------------------------------------

```

여기까지가 대략적인 `passport` 의 흐름이다.
이 흐름을 이해한다면, 아무래도 구현하는데, 왜 이 메서드를 사용하는지  
잘 와닿게 될 것이다.

### NestJS 에서 Passport

앞의 예시는 `express` 에서 사용가능한 방법이다.

이를 `NestJS` 에서 사용하려면 약간은 다르게 처리해주어야 한다.
`express` 에서는 `middleware` 라는 개념으로 처리했지만,
`NestJS` 에서는 다음의 방식으로 처리한다.

1. http 요청시 `guard` 를 통해 `authenticate` 함수를 실행한다.
2. `stratege` 가 호출되며, 이를 통한 사용자 인증 과정이 수행된다.
3. `serializer` 를 통햄 `session` 저장소에 등록 및 `req.user` 에 값을 할당한다.
4. 이후 `authenticate` 의 `req.login` 함수가 실행되며 인증 처리가 완료된다.
5. 인증과정에 문제가 없다면, `guard` 는 `true` 를 반환할 것이다.
6. 이후 해당 `controller` 의 `route` 가 실행된다.

이제 `passport` 를 `nest` 에서 실행하기 위해 다음의 패키지를 설치한다.

```sh

npm i @nestjs/passport passport passport-local express-session;
npm i -D @types/passport-local @types/express-session;

```

이제 `express-session`, `passport` 를 등록한다.

`main.ts`

```ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import session from 'express-session';
import passport from 'passport';

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


```

현재 `session` 저장소는 따로 다른 도구를 사용하지 않아, `memory` 상에 저장된다.
이제 `passport` 에 대한 초기 설정은 되었다.

`guard` 를 만들어 본다.

#### AuthenticateGuard 와 LoginAuthGuard

`LocalAuthGuard` 는 `password` 와 `email` 을 사용하여 유효한 사용자인지  
확인하는 `Guard` 이며, `AuthenticateGuard` 는 `cookie` 를 찾아 `cookie` 에  
있는 정보로 세션을 확인해 로그인이 완료된 사용자인지 판별한다.

`auth.guard.ts`

```ts

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


```

아무래도, `passport` 를 `NestJS` 에 맞도록 추상화한 것으로 인해  
한눈에 내용이 잘 들어오지는 않는다.

기존에 `passport` 의 흐름을 알고 보면 그나마 이러한 흐름이구나를  
알게 되는듯 하다.

### 세션에서 정보를 저장하고 읽는 `session serializer`

이제 `serializer` 를 구현한다.

`session.serializer.ts`

```ts

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


```

`SessionSerializer` 는 총 3개의 메서드를 제공한다.

1. **serializeUser**: `session` 객체에 저장할 값 설정
2. **deserializeUser**: `session` 객체에서 저장한 값을 사용하여,
(여기서는 `email` 이다.) `db` 에서 `user` 정보를 찾고 `req.user`  
에 찾은 `user` 정보 저장  
이후 모든 라우트에서 `req.user` 로 `user` 정보 접근가능
3. **getPassportInstance**: `passport` 의 인스턴스 객체를 반환  
`passport` 인스턴스 데이터가 필요한 경우 사용

앞전에 `passport` 의 흐름에 따라서 `local` 전략이 실행되고,  
`serializeUser` 가 실행된다.

`NestJS` 에서는 `LocalAuthGuard` 에서 `super.login` 을 호출하면  
`req.user` 의 값을 꺼내서 `serializeUser` 에 전달하고 실행된다.

`DeserializeUser` 는 `session` 객체에서 `email` 을 꺼내서 전달하고  
`user` 값을 찾아서 `req.user` 에 값을 전달한다.
`NestJS` 에서 직접적으로 `req.user` 를 사용할지는 확인해 봐야 하며,  
현재로써는 `isAutenticate` 를 사용하여 로그인된 유저인지 확인하는듯 하다.

`done` 에서 `Error` 를 전달하면 `403` 에러를 발생시킨다.  

이제 `localStrategy` 를 생성한다.

```ts

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

```

`email` 과 `password` 를 받아서 올바른지 검증한다.
`validate` 함수는 직접 정의하여 `Strategy` 타입에 추가하는 기능이며,  
내부적으로는 `verify` 함수와 연계되어 동작한다.

이는 `Mixin` 패턴을 토앻서 유연한 `Strategy` 구현과 다양한 인증 전략을  
통합하기 위한 설계방식이라고 한다.

이렇게 `Strategy` 와 `Serializer`, `LocalAuthGuard`, `AuthenticateGuard` 를  
구현했다.

기존의 `passport` 의 구현방식과 비슷하면서 더 추상적으로 변해서,  
지속적으로 `Docs` 를 확인해보아야 겠다...

이제, `auth.module.ts` 에 `LocalStrategy` 와 `SessionSerializer` 를  
등록한다.

```ts

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
  providers: [AuthService, LocalStrategy, SessionSerializer],
  controllers: [AuthController],
})
export class AuthModule {}

```

`PassportModule` 의 기본설정으로 `session` 설정이 `false` 이다.
`session` 을 사용하기 위해 `true` 로 변경한다

`LocalStrategy` 와  `SessionSerializer` 는 `Passport` 내부에서  
사용하므로, 프로바이더로 재공 해주어야 한다.

> 확실히 추상화 시킨것들은 내부 동작을 알수가 없어서 한번에 이해되지는  
않는다.

이제 모든 등록이 완료되었다.