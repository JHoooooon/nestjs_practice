# config-test

`NestJS` 에서 `configModule` 을 사용하기 위해서는 다음처럼 설치해야 한다.

```sh
npm i @nestjs/config;
```

`@nestjs/config` 는 `dotenv` 를 내부적으로 사용한다.
[NestJS Configuration](https://docs.nestjs.com/techniques/configuration) 에서 내용확인이 가능하다.

> `@nestjs/config` 는 `Typescript v4.1` 이후 사용가능하다

```ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  // ConfigModule.forRoot() 를 사용한다
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

```

`ConfigModule.forRoot()` 에는 많은 옵션이 존재한다

| 옵션 | 설명 |
| :--- | :--- |
| envFilePath: string | 사용할 `.env` 파일의 경로 |
| ignoreEnvFile: boolean | `.env` 파일을 사용하지 않고, 런타임상의 환경변수를 사용하기 위한 옵션 |
| ignoreEnvVars: boolean | 환경변수를 사용을 하지 않는 옵션 |
| isGlobal: boolean | 전역환경에서 환경변수를 사용할지 정하는 옵션 |
| encoding | 환경 변수 파일 인코딩 |
| validate | 환경 변수의 유효성 검증함수 |
| load | 커스텀 환경 설정 파일 로딩시 사용(ts, yaml...) |

`ConfigModule` 사용시 `.env` 를 사용하는 방법과 `custom file` 을 사용하는  
방법이 있다.

처음으로 `.env` 파일을 만들어 본다.

> .env file

```env

DATABASE_USER=test
DATABASE_PASSWORD=test

```

이러한 `.env` 파일을 `forRoot` 함수에서 호출하면서 `options` 를 입력한다

```ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// config module 사용
import { ConfigModule } from '@nestjs/config';

@Module({
  // configModule.forRoot() 를 사용하면
  // 기본적으로 .env 파일을 처리한다
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

```

`app.controller.ts` 에서 `.env` 의 환경변수를 읽으려면
`ConfigService` 를 주입하여 값을 읽는다.

```ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    // configService 를 주입
    private readonly configService: ConfigService,
    private readonly appService: AppService,
  ) {}

  @Get()
  getHello(): any {
    // 주입된 configService 에서 환경변수를 가져오기 위해서는
    // get 메서드를 사용한다.
    const db_user = this.configService.get('DATABASE_USER'); 
    const db_pass = this.configService.get('DATABASE_PASSWORD');
    return { db_user, db_pass };
  }
}

```

> localhost:3000 응답값

```sh
{
"db_user": "test",
"db_pass": "test"
}
```

환경 변수 사용시 위처럼 `ConfigService` 를 사용해야 하며, 이를 사용하기  
위해서는 `Module` 에 `COnfigModule.forRoot()` 을 `import` 해야 한다.

이 같은경우 `Module` 이 많아지면 불편한 상황이 생긴다고 한다.
이러한 경우 `isGlobal` 을 사용하여 처리한다.
말그대로 `전역적으로` 사용할 것인지 확인하는 것이다.

```ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// config module 사용
import { ConfigModule } from '@nestjs/config';

@Module({
  // configModule.forRoot() 를 사용하면
  // 기본적으로 .env 파일을 처리한다
  imports: [ConfigModule.forRoot({
    isGlobal: true,
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

```

이후 새로운 `Module` 들이 생성된다고 해도 각 모듈마다 `ConfigModule` 설정없이  
바로 `ConfigService` 만 주입한다면 해당 환경변수 사용이 가능하다

하지만 환경변수는 여러 상황에서 처리가 이루어진다.
`.env` 만 사용한다면, `forRoot()` 만 사용해도 환경변수 참조가 가능하다.

하지만 `.env.dev`, `.env.prod`, `.env.qa`, `.env.test` 방식으로 각 환경에  
따라 다른 환경변수들을 나눌수도 있다.

이러한 경우라면 `forRoot()` 하나만으로 사용이 어렵다
그렇기에 `options` 중 `envFilePath` 를 사용하여 사용할 `env` 파일을  
지정한다.

책에서는 처음에 `package.json` 에서 `NODE_ENV` 를 사용하여 환경변수를
작성한다.

```ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { WeatherModule } from './weather/weather.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // process.cwd() 가 `src` 가 아니라 `config-test` 를 가리킨다
      // 이는 현재 실행중인 프로세스의 현재 디렉토리를 가리킨다
      // 실행중인 프로세스 시점에서 실행되는 디렉토리는
      // package.json 을 가진 폴더이기에 `config-test` 를 가리킨다.
      envFilePath: `${process.cwd()}/envs/.env.${process.env.NODE_ENV}`,
    }),
    WeatherModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

```

이렇게 하는데, `prcoess.env.NODE_ENV` 는 스크립트 실행에 따라 달라진다.
`NODE_ENV=local npm run start`, `NODE_ENV=dev npm run start:dev`, `NODE_ENV=test npm run start:prod` 처럼 각 실행때마다 달라지도록 처리한다.

그럼 위의 `envFilePath` 는 `<package.json 이 있는 디렉터리>/envs/.env.{실행된 스크립트에 따른 NODE_ENV 값}` 이 된다.

## 커스텀 환경 변수 파일

`ConfigModlue` 사용시 `.env` 파일뿐 아니라 커스텀 파일 작성역시 가능하다.  
`ymal`, `ts` 등등의 파일로 작성이 가능하며, 이경우 좀더 복잡한  
환경 설정이 필요할때 사용한다고 한다.

```ts
// 공통으로 사용될 common.ts
import common from './common';
// local 에서 사용될 local.ts
import local from './local';
// dev 에서 사용될 local.ts
import dev from './dev';
// prod 에서 사용될 local.ts
import prod from './prod';

// 현재 NODE_ENV 의 환경변수
const phase = process.env.NODE_ENV;

// 임시적 conf 선언
let conf = {};
// phase 의 값에 따라 conf 설정
if (phase === 'local') {
  conf = local;
} else if (phase === 'dev') {
  conf = dev;
} else {
  conf = prod;
}

// 반환값은 함수이다. 환경변수로 사용될 객체를 반환한다.
// 여기서는 `commmon` 과 `phase` 에 따라 할당된 conf 객체 값을
// `spread syntax` 를 사용해서 할당하는 것을 볼수 있다.
export default () => ({
  ...common,
  ...conf,
});
```

이후에 커스텀 환경 변수를 `NestJS` 의 모듈에 `import` 해주어야 한다.
이를 위해서 `forRoot()` 의  `options 객체` 에 `load` 프로퍼티를 사용하여  
값을 배열의 원소로 준다.

```ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { WeatherModule } from './weather/weather.module';
import conf from 'envs/conf';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${process.cwd()}/envs/.env.${process.env.NODE_ENV}`,
      // 사용자 커스텀 환경변수를 사용하기 위해
      // load 를 통해 커스텀 환경변수를 담은 함수를 넣는다.
      // 이렇게 하면 자동적으로 `NestJS` 가 해당 환경변수를 담은 함수를
      // 읽어 환경변수로 넣어준다.
      load: [conf],
    }),
    WeatherModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

```

이것외에도 `yaml` 파일 역시 사용가능하다.
`node` 에서 `yaml` 을 읽으려면 `yaml-js` 패키지를 설치해야 한다.

```sh

npm i yaml-js; npm i -D @types/yaml-js

```

이렇게 설치한후 다음 `yaml` 파일을 불러와 사용한다.

```ts

...
import { reafFileSync } from 'fs';
import * as yaml from 'yaml-js'; 

...

const yamlConfig: Record<string, any> = yaml.load(
  // yaml 이 설정되어 있는 파일을 읽어온다.
  readFileSync(`${process.cwd()}/envs/config.yaml`, 'utf-8'),
);

// load 해서 읽을 함수에서 반환할 객체에
// spread 하여 사용한다.
export default (): Record<string, any> => ({
  ...common,
  ...conf,
  ...yamlConfig,
});

```

이제 해당 설정함수를 `load` 의 배열에 넣어주면 환경변수로 등록된다.

`NestJS` 의 `ConfigModule` 에서는 `cache` 라는 옵션이 주어진다.
`cache` 는 말그래도 메모리에 `key/value` 페어를 캐시해 둘것인지 여부이다.

`환경변수` 는 `server` 가 한번 실행되고, 잘 변경되지 않는 값이다.
그러므로, 이러한 값들은 `cache` 해 두는편이 좋다.

> 매번 `configModule` 이 실행되면서 파일내용을 파싱하고 환경변수로 등록되는  
과정이 발생한다면 성능상 좋은 방법은 아닐것이다.
> 한번 메모리에 저장해 놓으면 파싱하지 않고 바로 캐시되어있는 값을 가져와
> 사용하면 되므로 파싱하는 과정을 생략할 수 있다.

```ts

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      // process.cwd() 가 `src` 가 아니라 `config-test` 를 가리킨다
      // 이는 현재 실행중인 프로세스의 현재 디렉토리를 가리킨다
      // 실행중인 프로세스 시점에서 실행되는 디렉토리는
      // package.json 을 가진 폴더이기에 `config-test` 를 가리킨다.
      envFilePath: `${process.cwd()}/envs/.env.${process.env.NODE_ENV}`,
      load: [conf],
    }),
    WeatherModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

```

## 확장변수 사용하기

확장변수라고 하는데, 사실 별것 없다.
간단하게 이미 만들어둔 변수를 재사용하여 새로운 변수에 할당하는 것이다.

```env

LOCAL=localhost
PORT=3030

// 확장변수 
URL=http://${LOCAL}:${PORT}

```

`NestJS` 에서도 이러한 확장변수(`expandable variables`) 을 사용하는데,  
내부적으로 `dotenv-expand` 를 사용한다.

이러한 `expandable variables` 를 사용하기 위해서는 다음과 같은 옵션이  
필요하다.

```ts

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      // 확장변수를 사용한다.
      expandVariables: true,
      envFilePath: `${process.cwd()}/envs/.env.${process.env.NODE_ENV}`,
      load: [conf],
    }),
    WeatherModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

```

## main.ts 에서 환경변수 사용

책에서보면 단순 `rootModule` 에 환경변수 사용시 `main.ts` 에서 환경변수  
사용이 어렵다고 한다.

맞는말이다. 기본적으로 `NestJS` 의 진입점은 `main.ts` 이다.
그로인해 `bootstrap` 함수가 실행되고, 함수 내부에서 `NestFactory.create` 가  
실행된다.

이후 `NestFactory.create` 함수의 인자로 주어진 `rootModule` 이 실행되며,
`rootModule` 에서 `imports` 된 `ConfigModule` 이 실행되는 순서이다.

`main.ts` 의 `bootstrap` 함수 호출시의 시점에서 `ConfigModule.forRoot()` 가  
실행되는 시점은 `NestFactory.create` 가 호출된 다음의 시점이다.

그러므로, `NestFactory.create` 함수 호출이 끝난다음 반환된 `app` 변수를  
사용하여 접근해야만 한다.

`app` 변수는 `get` 이라는 메서드를 가지고 있으며,
이 `get` 을 통해 `ConfigService` 를 인자값으로 주면,
`configService` 값을 받아서 환경변수로 불러올수 있게 된다.

```ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.get 의 인자로 `ConfigService` 를 준다.
  // express 에서 app.get 을 사용하여 값을 불러오는 용도로 사용하기도 한다.
  // source code 를 살펴보아야 겠지만, 
  // app.set(ConfigService, envObj);
  // 방식으로 내부처리 하지 않았나 싶다.
  // 그러면 app.get(ConfigService) 로 해당 envObj 값을 가져올수 
  // 있게 처리 가능할것이다.
  // 
  // `ConfigService` 자체가 식별자가되서 값을 가져오는 역할을
  // 한다고 볼수 있을것 같다.
  //
  // configService 에 envObj 를 할당한다
  const configService = app.get(ConfigService);
  // configService.get 을 사용하여 환경변수에 접근한다
  await app.listen(configService.get('http.port'), () =>
    console.log(configService.get('http.port')),
  );
}

bootstrap();

```
