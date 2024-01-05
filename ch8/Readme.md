# CH8

`nestjs` 에서는 `nest-cli` 를 사용하여 쉽게 프로젝트 구성이 가능하다.
하지만, `nestjs` 가 어떠한 방식으로 설치되고 사용되는지 알아야 한다.

```sh
  npm i @nestjs/core @nestjs/common @nestjs/platform-express reflect-metadata typescript 
```

위에 보면 여러개의 `nestjs` 를 설치하는것을 볼 수 있다.

1. `@nestjs/common`:
  실제 프로젝트에 사용할 대부분의 코드가 들어가 있다.
  이는 데코레이터로 사용하는 함수들의 클래스들이 대표적이라 한다

2. `@nestjs/core`:
  `@nestjs/common` 에서 사용할 가장 기본적인 `nestjs` 의 코드가 있다.
  `guard`, `middelware`, `pipe` 등을 만드는 핵심 코드가 있다

3. `@nestjs/platform-express`:
  이는 `nestjs` 가 사용하는 `HTTP` 의 미들웨어를 `Express` 로 사용하기
  위해 사용되는 라이브러리이다.
  이제 `HTTP` 의 `req` 및 `res` 객체는 `express` 로 사용한다.

4. `Tyepscript` 의 `experimentalDecorators` 와 `emitDecoratorMetadata` 는
데코레이터 관련 부분이다. `NestJS` 에서는 `decorator` 를 많이 사용하므로
필요한 옵션이다.

5. `experimentalDecorators` 는 데코레이터를 사용할지 여부이다.
  하지만 `typescript v5.0` 이상은 정식지원한다.
  `emitDecoratorMetadata` 는 타입스크립트를 자바스크립트로 컴파일 시
  데코레이터가 설정된 클래스, 함수, 변수, 객체의 메타 데이터를 함께
  넣어줄지 여부를 선택한다.

> 자바스크립트 컴파일이후 `meta decorator` 에는 데코레이터를 달아준 곳이
함수인지, 클래스인지, 변수인지 에 대한 여부와 매개변수가 있다면 해당 타입,
그리고 결과값을 포함한다.
>
> 메타 데이터를 넣을때 의존성 패키지로 설치한 `reflect-metadata` 가 사용되며
> 이를 사용하기 위해서는`emitdecoratorMetadata` 를 같이 사용해야 한다.
>

## NestJS 의 모듈과 컨트롤러

`NestJS` 는 웹 서버이므로 기본적으로 `HTTP` 의 요청/응답을 처리한다.
일반적으로 웹 애플리케이션 서버에서 `HTTP` 요청/응답을 처리하기 까지
몇 단계를 거치게 된다.

`NestJS` 에서 `HTTP` 요청을 보통 다음과 같이 처리한다

```sh
| 가드 | -> | 인터셉터 | -> | 파이프 | -> | 컨트롤러 | -> | 서비스 | -> | 리포지토리 | 
```

여기서 필수는 `Controller` 와  `Module` 이다.
`Controller` 는 요청을 코드에 전달하는 역할을 하며,
`Controller` 는 `Module` 에 포함되기 때문이다.

이는 다음과 같이 처리한다.

1. ***Guard***:
  인증(`Authentication`) / 인가(`Authorization`) 처리
2. ***Interceptor***:
    - 메소드 실행 **전/후**에 추가 로직 바인딩
    - 함수에서 반환될 결과를 변환
    - 함수에서 발생 된 예외를 변환
    - 기본 기능 확장
    - 특정 조건에 다라 기능을 완전히 재정의

    **`전/후`** 라는 단어가 중요하다.
    이는 `req` 처리 전과 이후에 처리를 한다는 것이다.
    더 명확한건 [NestJS Request LifeCycle](https://docs.nestjs.com/faq/request-lifecycle#summary) 를 보면 더 명확하게 처리순서를 볼 수 있다.
3. ***Pipe***:
  요청에 대한 유효성 검증
4. ***Controller***:
  특정 함수에 값을 전달(라우팅)
5. ***Service***:
  `business logic` 을 구현
6. ***Repository***:
  데이터 저장

대략적인 이 흐름이 `NestJS` 를 이해하기 위해서는 필요하다.

## NestJS 의 네이밍 규칙

> 파일명은 `.` 으로 구분하되, 모듈에 2개 이상의 단어가 있다면 `-` 으로 연결한다.

```sh
hello.controller.ts
my-first.controller.ts
```

> 클래스명은 Camel Case 를 사용한다

```sh
// <모듈명><컴포넌트명>
export class HelloController {}
```

> 같은 디렉터리에 있는 클래스는 `index.ts` 를 통해서 `import` 하는것을 권장한다.

```ts
// index.ts 를 사용하지 않는 경우
import { MyFirstController } from './controllers/my-first.controller'
import { MySecondController } from './controllers/my-second.controller'

// index.ts 를 사용한 경우
import { MyFirstController, MySecondController } from './controllers';

```

> 인터페이스 작명법으로 앞에 `I` 를 붙이는 방법이 있다.
> 하지만 이부분인 어색한 부분이 있으므로,  
> `Series` 인터페이스를 만들고 그 하위 인터페이스 혹은 클래스를 만든다.

```ts
interface Series {}
interface BookSeries extends Series {}
class MovieSeries extends Series {}
```

이는 협업하는 환경에 따라 달라질수 있다.
