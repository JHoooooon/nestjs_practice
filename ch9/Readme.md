# CH9

서버의 환경 변수는 중요하다.
각 환경에 따라 설정할 변수는 서로 달라질 수 있으며, 따로 관리해야 한다.
만약, 배포용이라면 배포 환경에 맞는 환경변수, 테스트용이라면 테스트용에 맞는  
환경변수, 개발용 환경변수, 프로덕션용 환경변수로 말이다.  

이러한 환경변수는 민감한 정보가 들어갈수 있다.
이를 위해 별도의 파일로 두거나 외부 서버에 설정해서 읽어올 수 있도록 해야 한다

`NestJS` 에서 환경변수 설정은 `ConfigModule` 에서 할 수 있으며,  
설정된 환경 변수를 다른 모듈에서 가져다 쓰려면 `ConfigService` 를 주입받아서  
사용해야 한다.

`ConfigModule` 은 초기화를 해야 한다.
`ConfigModule.forRoot()` 함수로 초기화가 가능하다

보통 `app.module.ts` 에서 해당 코드를 실행한다

> 이건 전역 설정되는 환경변수이므로, `app.module.ts` 에서 사용되는  
> 모듈에서 `import` 문을 사용해 해당 모듈을 사용하는것이 맞기는 하다.
>
> 여기서 `app.module.ts` 의 `appMdoule` 은 모든 모듈의 진입점이다.
>

```sh


        main.ts
      ==============
      bootstrap 호출
      ==============
            |
            v
    ConfigModule 초기화
============================
  --------------------------
  ConfigModule.forRoot() 
          로 초기화
  -------------------------
            |
            v
  -------------------------
      envFilePath 에서 
        환경변수 읽음
  -------------------------
            |
            v
  -------------------------
      process.env 와 병합
  -------------------------
            |
            v
  -------------------------
      load 옵션 설정과 병합
  -------------------------
  

```

> ***모듈***
>
> `NestJS` 에서는 `Module` 을 사용하는 방식에 대한 이해도가 있어야 한다.
> 흔히 `Module` 사용시 `@Module()` 데커레이터를 사용한다.
>
> 각 `application` 은 최소 한개이상의 모듈을 가진다.
> 이 최상위 모듈을 보통 `rootModule` 이라고 한다.
>
> `rootModule` 은 `NestJS` 에서 사용하는 `Application Graph` 를 `build` 하는데  
> 그 시작지점이다.
>
>> 여기서 `Application Graph` 는 `NestJS` 에서 내부적으로 `module` 간의  
>> `Providers` 그리고 `Dependencies` 를 해결해주는데 사용된다
>
> `NestJS` 는 `components` 의 구조화를 위한 효과적인 방법으로 `Module` 사용을  
> 강력하게 추천한다.
>
> 기본적으로 제공하는 `Module` 의 `properties` 이다.
>
> | Name | Desc |
> | :--- | :--- |
> | Providers | `Nest Injector` 에 의해 인스턴스화 되고 해당 모듈 에서 공유될수 있는 `Provider` 이다.
> | Controllers | 인스턴스화되어야 하는 `Module` 안에서 `controllers` 의 모음이 정의된다.
> | Imports | `import` 된 `modules` 의 리스트로 모듈에서 필요한 `providers` 를 `export` 한다
>
> 이 `module` 은 기본적으로 `providers` 를 캡슐화 한다.
> 캡슐화 한다는 의미는 `import` 된 `modules`, 현재 `module` 의 한부분을  
> 즉각적으로 `provider` 를 주입 가능하다는 것을 의미한다.
>
>
> ***다이나믹 모듈***
>
> `ConfigModule` 에 대해서 조금이나마 이해하기 위해서는 `dynamic module` 에  
> 대해 알아야 한다.
>
> `Nest module system` 은 `dynamic modules` 라는 강력한 기능을 제공한다.
> 이 기능은 맞춤형 모듈을 쉽게 생성할수 있도록 허용하는 기능이다.
> 
> 이 기능은 동적으로 `providers` 를 설정하고, 저장할 수 있다
>
```ts

import { Module, DynamicModule } from '@nestjs/common';
import { createDatabaseProviders } from './database.providers';
import { Connection } from './connection.provider';

@Module({
  providers: [Connection],
})
export class DatabaseModule {
  static forRoot(entities = [], options?): DynamicModule {
    const providers = createDatabaseProviders(options, entities);
    return {
      module: DatabaseModule,
      providers: providers,
      exports: providers,
    };
  }
}
 
```

> 이 모듈은 기본적으로 `Connection provider` 를 정의한다
> 그러나 `entities` 그리고 `options` 객체를 전달받는 `forRoot()` 정적 메서드  
> 에 의존한다.
>
> `Dynamic module` 에 의해 반환된 속성은 `@Module()` 데커레이터에 정의된  
> 기본 모듈 메타데이터를 확장한다.
>
> 마치 `overriding` 처리하는것 같다.
> 만약 `global` 로 설정하고 싶다면 다음처럼 한다.

```ts

import { Module, DynamicModule } from '@nestjs/common';
import { createDatabaseProviders } from './database.providers';
import { Connection } from './connection.provider';

@Module({
  providers: [Connection],
})
export class DatabaseModule {
  static forRoot(entities = [], options?): DynamicModule {
    const providers = createDatabaseProviders(options, entities);
    return {
      global: true,
      module: DatabaseModule,
      providers: providers,
      exports: providers,
    };
  }
}
 
```

> `global` 로 선언하는 방식은 좋은 디자인이 아니라고 경고한다.
>
> 이렇게 만들어진 `DatabaseModule` 은 다음처럼 `imports` 가능하다

```ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { User } from './users/entities/user.entity';

@Module({
  imports: [DatabaseModule.forRoot([User])],
})
export class AppModule {}
```

> 마치, `ConfigModule` 을 사용하는 방식과 같아보인다.
> 이는 실제로 `ConfigModule` 역시 `Module` 이며,
> 위처럼 `.env` 를 상속받아서 `NestJS` 에서 사용가능하도록
> 모듈화 시킨것에 불과하기 때문이다.
>
> `Dynamic Module` 같은경우 `static` 메서드를 만드는
> 컨벤션이 존재하는데 다음과 같다
>
> 1. ***register***:
> 특정 `module`에서만 사용할 특정 `config`로 동적 모듈을 구성하려고 할때 사용
> 이 부분은 잘 와닿지 않는 다.
>
> 2. ***forRoot***:
> 동적 모듈을 여러 곳에서 사용될 용도로 한번산 설정되는 동적 모듈
>
> 3. ***forFeature***:
> `forRoot` 를 사용하지만, 호출 모듈의 요구사항에 맞게 일부 `config` 를  
> 수정해야 하는 경우
>

대략적인 내용이다.

