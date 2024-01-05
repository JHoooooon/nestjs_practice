# Hello-nestjs

## NestFactory

`NestFactory` 는 `NestFactoryStatic` 클래스이다.
`create` 함수에 루트 모듈을 넣어서 `NestApplication` 객체를 생성한다.

> 여기서 `rootModule` 은 `HelloMoulde` 이다.

생성된 `NestApplication` 객체에는 `HTTP` 부분을 모듈화한 `HTTPAdapter` 가 있다.
여기서 `HTTPAdapter` 는 `Express` 이다.

이제

```sh
npx ts-node-dev src/main.ts
```

를 실행시키면 `nestJS` 서버를 실행시킬수 있게 된다.
