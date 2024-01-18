# 파일 업로드 API 만들고 테스트하기

`multer` 는 이미 `nestJS` 생성시 존재하므로, `@types/multer` 를  
설치해준다.

```sh

npm i -D @types/multer;

```

이후 컨트롤러를 사용하여 `FileInterceptor` 를 사용한다.
여기서 `Interceptor` 란 `request` 및 `response` 간에 로직을 추가하는  
미들웨어를 말한다.

```ts
import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('file-upload')
  // interceptor 사용
  // FileInterceptor 는 클라이언트의 요청에 따라 파일명이 file 인 파일이 있는지 확인한다
  @UseInterceptors(FileInterceptor('file'))
  // @UploadedFile 은 헨들러 함수의 데커레이터 함수이다.
  // 이는 인수로 넘겨진 값 중에 file 객체를 지정해서 꺼내는 역할을
  // 한다.
  fileUpload(@UploadedFile() file: Express.Multer.File) {
    // 바이너리 값으로 있는 `file` 을 `toString` 을 통해
    // utf-8 로 encoding
    console.log(file.buffer.toString('utf-8'));
    return `File Upload`;
  }
}
```

`FileInterceptor` 는 요청에서 파일을 읽으며,
파일 크기, 형식, 이름, 경로등을 확인한다.
그리고, 요청 객체에서 파일의 내용을 `req.file` 속성에 저장한다.

이는 총 3가지의 옵션을 받는데 `limit`, `transformers`, `storage`, `preservePath`이다.

이후에 `@UploadedFile` 데커레이터를 사용하여, `request` 객체에서  
파일의 내용을 해당하는 인자값에 넣어준다.

```http

@url=http://localhost:3000

POST {{url}}/file-upload
Content-Type: multipart/form-data; boundary=test-file-upload

--test-file-upload
Content-Disposition: form-data; name="file"; filename="test.txt"

텍스트파일의 내용을 넣는다.
--test-file-upload--

```

이에 대해서는 약간의 설명이 필요할것 같아 책의 내용을 참조해서 적는다.

`Content-Type` 은 `multipart/form-data` 로 지정하며, `boundary` 값을  
지정한다.

`boundary` 는 여러 `form-data` 메시지의 각 부분을 구분하는  
구분자 역할을 한다.

이러한 구분자를 선언하고, 사용하려면 다음처럼 사용한다.

`--test-file-upload`

이는 `boundary` 값으로 `test-file-uplaod` 로 지정하여 사용한것이며,
사용을 위해 앞에 `--` 을 붙힌다.

이후 전송하려는 매개변수가 어떤 데이터인지 정의해야 하는데,  
이러한 역할을 `Content-Disposition` 이 한다.

여기서 `Content-Disposition` 은 `form-data` 이고, 이름은  
`file` 이며, `filename` 은 `test.txt` 이다.

여기서 실제 파일을 전송하지 않고, 직접 작성한 내용을 전달한다.

```http
--test-file-upload
Content-Disposition: form-data; name="file"; filename="test.txt"

텍스트파일의 내용을 넣는다.
```

이렇게 하면 `텍스트파일의 내용을 넣는다.` 가 데이터가 된다.
그럼 이러한 구분자를 마무리 지어야 한다.abnf

구분자를 마무리할때는 마지막에 `--` 을 붙힌다.
이는 폼전송을 종료한다는 뜻이다.

`--test-file-upload--`

이렇게 하면 내용은 다음과 같이 생길것이다.

```http
--test-file-upload
Content-Disposition: form-data; name="file"; filename="test.txt"

텍스트파일의 내용을 넣는다.
--test-file-upload--
```

이 내용을 `REST-Client` 를 사용하여 서버에 요청한다.

```sh

HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 11
ETag: W/"b-ZDhf2+9Vimuz9rF3jDi5CMqTw4o"
Connection: close

File Upload

```

이렇게 응답이 오게 되며, `terminal` 상에서는 다음처럼 출력한다.

```sh

[Nest] 36246  LOG [NestFactory] Starting Nest application...
[Nest] 36246  LOG [InstanceLoader] AppModule dependencies initialized +11ms
[Nest] 36246  LOG [RoutesResolver] AppController {/}: +11ms
[Nest] 36246  LOG [RouterExplorer] Mapped {/, GET} route +2ms
[Nest] 36246  LOG [RouterExplorer] Mapped {/file-upload, POST} route +1ms
[Nest] 36246  LOG [NestApplication] Nest application successfully started +1ms
텍스트파일의 내용을 넣는다.

```

다음처럼 하면 `txt` 파일을 넣을수도 있다
이는 `src` 파일 안에 `test.txt` 를 만들고 적용한 예시이다.

```http
--test-file-upload
Content-Disposition: form-data; name="file"; filename="test.txt"

< test.txt
--test-file-upload--

```

이렇게 하면 `test.txt` 의 내용이 출력되는것을 볼 수 있다

```sh
[Nest] 36246  LOG [NestFactory] Starting Nest application...
[Nest] 36246  LOG [InstanceLoader] AppModule dependencies initialized +11ms
[Nest] 36246  LOG [RoutesResolver] AppController {/}: +11ms
[Nest] 36246  LOG [RouterExplorer] Mapped {/, GET} route +2ms
[Nest] 36246  LOG [RouterExplorer] Mapped {/file-upload, POST} route +1ms
[Nest] 36246  LOG [NestApplication] Nest application successfully started +1ms
실제 txt 파일

```

디스크파일에 저장하기 위해서는 `storage` 를 만들어야 한다.
현재는 `default` 인 `memory storage` 를 통해 `memory` 에  
저장했다.

하지만 이렇게 하지 않고, `disk` 에 저장하기 위해 새로운  
`storage` 를 생성한다.

```ts

import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

export const multerOption = {
  storage: diskStorage({
    // destination 으로 uploads 폴더를 정한다.
    destination: join(__dirname, '..', 'uploads'),
    // filename 을 지정한다
    filename: (req, file, cb) => {
      // 랜덤한 uuid 값과 file.originalname 에서 추출한 extname 값을
      // 합쳐서 내보낸다.
      cb(null, randomUUID() + extname(file.originalname));
    },
  }),
};

```

`multer` 에서 `disk` 에 저장하기 위한 `diskStorage` 가 존재하며,  
`multer` 옵션을 사용하여 `destination` 과 `filename` 을 지정한다.

이제 `multer` 옵션을 `multer` 에 적용한다.
이는 `FileInterceptor` 로 적용한다.

```ts
import { multerOption } from './multer.options.ts';

  ...

  @Post('file-upload-storage')
  @UseInterceptors(FileInterceptor('file', multerOption))
  fileUploadStorage(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
    return 'File Upload';
  }

```

이렇게 하면 `multerOption` 으로 `Storage` 로 `DiskStorage` 가된다.
이제 `REST-Clinet` 를 사용하여 요청을 보내보면 제대로 동작하는것을  
볼수 있다.

## 정적 파일 서비스

파일 업로드를 하는 이유는 서비스에서 사용하기 위함이다.
이는 텍스트, 이미지, 동영상 같은 파일은 한번 저장하면 변경되지  
않으므로 정적 파일이라 부른다.

이렇게 정적파일을 서비스할수 있도록 하려면 다음의 패키지를 설치해야  
한다.

```ts

npm i @nestj/serve-static

```

이는 `ServeStaticModule` 이 있으며, 해당 모듈을 초기화하면 정적  
파일 서비스가 가능하다.

초기화 시에는 `forRoot()` 함수를 사용해 초기화한다

```ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

```

`rootPath` 는 파일이 저장될 폴더를 말하며,
`serveRoot` 는 사용할 라우트 명을 말한다.

이제 `uploads` 폴더안의 정적파일을 `http://locahost:3000/uploads/filename` 을 통해 접근가능하다.

```http

### serve static file
POST {{url}}/file-upload-storage
Content-Type: multipart/form-data; boundary=test-file-upload

--test-file-upload
Content-Disposition: form-data; name="file"; filename="cat.jpeg"

< cat.jpeg
--test-file-upload--

```

이렇게 하고,
`http://localhost:3000/uploads/6d6b44db-e2c4-406e-af9c-0d60bfab3791.jpeg` 로 접속해보면, 해당 파일을 인터넷상에서 접근할수 있게 된다.
