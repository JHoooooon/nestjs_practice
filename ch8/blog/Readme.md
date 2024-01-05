# Blog

이 책에서는 첫번째 프로젝트로 `blog` 앱을 만든다.

```ts
.
├── nest-cli.json // nest-cli 설정 json 파일 
├── package.json // npm package json 파일
├── package-lock.json // npm package lock json 파일
├── Readme.md // Readme 파일
├── src 
│   ├── app.controller.spec.ts // 컨트롤러 테스트 코드
│   ├── app.controller.ts // 컨트롤러
│   ├── app.module.ts // 모듈
│   ├── app.service.ts // 서비스
│   └── main.ts // 서비스 메인 파일
├── test
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── tsconfig.build.json
└── tsconfig.json // typescript 설정

```

이 같은 폴더 구조를 가진다.

아래는 `package.json` 의 `script` 부분의 내용이다.

> package.json

```json
  "scripts": {
    "build": "nest build", // ts 파일을 dist 폴더안에 js 로 build 한다 
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"", // prettier 포메터 실행
    "start": "nest start", // nest 서버 실행
    "start:dev": "nest start --watch", // dev 모드로 서버 실행 (파일 코드 변경 감지)
    "start:debug": "nest start --debug --watch", // debug 모드로 dev 서버 실행
                                                 // 파일 코드 변경 감지 및
                                                 // 디버그 처리
    "start:prod": "node dist/main", // build 된후 main.js 파일로 서버 실행
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix", 
    // eslint 를 사용하여 ts 파일 검사
    "test": "jest", // 테스트 실행
    "test:watch": "jest --watch", // 테스트 실행(파일 코드 변경 감지)
    "test:cov": "jest --coverage", // 테스트 실행(coverage 실행)
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand", //  테스트 실행(debug)
    "test:e2e": "jest --config ./test/jest-e2e.json" // e2e 테스트 실행
  },

```

위의 코드에서 처럼 `start` 를 실행하면 `nest-cli` 를 통해 생성된
서버가 실행된다

```sh
npm run start;
```

`NestJS` 에는 수많은 컴포넌트들이 존재한다.
그중 컨트롤러는 유저가 보낸 `HTTP` 요청을 어떤 코드에서 처리할지 정하는 역할을 한다.

`Express` 에서 `Router` 부분의 역할을 한다는 생각이 든다.

컨트롤러는 일단 이러한 방식으로 되어있다.

```ts
import { Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';

@Controller('blog')
export class BlogController {
  // 모든 게시글 요청
  @Get()
  getAllPosts() {}

  // 게시글 요청
  @Get('/:id')
  getPost(@Param('id') id: string) {}

  // 게시글 생성
  @Post()
  createPost() {}

  // 게시글 수정
  @Put('/:id')
  updatePost(@Param('id') id: string) {}

  // 게시글 삭제
  @Delete('/:id')
  deletePost(@Param('id') id) {}
}

```

이렇게 만들어진 `controller` 는 서버의 경로를
라우팅해주는 역할을 한다.

이제 `controller` 에서 사용될 `service logic` 을  
만들기 위해 `blog.service.ts` 를 만들고 다음처럼
서비스 로직을 만든다. 

```ts
import { Injectable } from '@nestjs/common';
import { PostDto } from './blog.model';

@Injectable()
export class BlogService {
  // blogService 에서 사용할 posts 배열
  // 일단 repository 를 사용하지 않고
  // 메모리 저장을 위해 posts 로 처리한다.
  posts = [];

  // 모든 posts 응답
  getAllPosts() {
    return this.posts;
  }

  // 특정 post 응답
  getPost(id: string) {
    const post = this.posts.find((post) => post.id === id);
    return post;
  }

  // post 생성 및 모든 posts 응답
  createPost(postDto: PostDto) {
    const id = this.posts.length + 1;
    this.posts.push({ id: id.toString(), ...postDto, createDto: new Date() });
    return this.posts;
  }

  // post 삭제 이후 filteredPost 반환
  deletePost(id: string) {
    const filteredPosts = this.posts.filter((post) => post.id !== id);
    this.posts = filteredPosts;
    return filteredPosts;
  }

  // post 업데이트
  updatePost(id: string, postDto: Partial<PostDto>) {
    const idx = this.posts.findIndex((post) => post.id === id);
    this.posts[idx] = {
      id,
      ...postDto,
      updatedDt: new Date(),
    };
    return this.posts[idx];
  }
}

```

이렇게 `blogService` 클래스를 만들어 사용할 비지니스 로직을 생성한다.

이는 `blogController` 클래스에서 사용할 것이다.
이는 다음과 같다.

```ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { PostDto } from './blog.model';

@Controller('blog')
export class BlogController {
  // BlogService 클래스를 할당할 field
  blogService: BlogService;
  constructor() {
    // BlogController 를 instance 생성시
    // blogService field 에 BlogService class 의 instance 를 생성
    this.blogService = new BlogService();
  }

  // 모든 게시글 요청
  @Get()
  getAllPosts() {
    // blogService 의 getAllPosts 실행
    return this.blogService.getAllPosts();
  }

  // 게시글 요청
  @Get('/:id')
  getPost(@Param('id') id: string) {
    // blogService 의 getPost 실행
    return this.blogService.getPost(id);
  }

  // 게시글 생성
  @Post()
  createPost(@Body() postDto: PostDto) {
    // blogService 의 createPost 실행
    return this.blogService.createPost(postDto);
  }

  // 게시글 수정
  @Put('/:id')
  updatePost(@Param('id') id: string, @Body() postDto: Partial<PostDto>) {
    // blogService 의 createPost 실행
    return this.blogService.updatePost(id, postDto);
  }

  // 게시글 삭제
  @Delete('/:id')
  deletePost(@Param('id') id) {
    // blogService 의 deletePost 실행
    return this.blogService.deletePost(id);
  }
}


```

지금 보면 `blogController` 가 `blogService` 를 강하게 의존하고 있다.

이는 `blogController` 자체 내에서 `blogService` 를 생성하고 있기 때문이다.

이를 해결하기 위해서 `NestJS` 는 `Dependancy Injection` 을 사용하여 처리한다.

일단 이러한 `의존성 주입` 을 사용하는 부분은 일단 나중에 설명한다고 한다

서버를 실행해보면 제대로 동작하는것을 볼 수 있다.

## 파일에 정보를 저장하도록 API 업그레이드 하기

현재는 배열자체에 저장하므로, 서버가 종료되면 모든 정보가 사라진다.

이를 해결하려면 파일 혹은 `DB` 에 정보를 저장해야 한다.
이를 `Architecture` 관점에서 보면 영속성 계층(`persistance layer`)이라 한다.

`Controller` 는 변경하지 않으며, 파일에 저장하는 코드를 
다음과 같이 추가해 본다.

`interface` 를 사용하면 확장석이 좋은 프로그램을 만들 수 있다.

> blog.repostory.ts

```ts

import { readFile, writeFile } from 'fs/promises';
import { PostDto } from './blog.model';

// blogRepository 의 인터페이스 생성
export interface BlogRepository {
  // 모든 posts 응답
  getAllPosts(): Promise<PostDto[]>;
  // 새로운 post 생성
  createPost(postDto: PostDto): Promise<void>;
  // 특정 post 응답
  getPost(id: string): Promise<PostDto>;
  // 특정 post 삭제
  deletePost(id: string): Promise<void>;
  // 특정 post 업데이트
  updatePost(id: string, postDto: Partial<PostDto>): Promise<void>;
}

// blogRepository 인터페이스를 상속받아 BlogFileRepository 생성
export class BlogFileRepository implements BlogRepository {
  // 사용할 file 경로를 field 로 할당
  FILE_NAME = './src/blog.data.json';

  // blogRepository 의 getAllPosts 를 구현
  async getAllPosts(): Promise<PostDto[]> {
    const datas = await readFile(this.FILE_NAME, 'utf-8');
    const posts = JSON.parse(datas) as PostDto[];
    return posts;
  }

  // blogRepository 의 getPost 를 구현
  async getPost(id: string): Promise<PostDto> {
    const posts = await this.getAllPosts();
    const post = posts.find((post) => post.id === id);
    return post;
  }

  // blogRepository 의 cretaePost 를 구현
  async createPost(postDto: PostDto): Promise<void> {
    const posts = await this.getAllPosts();
    const id = posts.length + 1;
    posts.push({
      id: id.toString(),
      ...postDto,
      createdDt: new Date(),
    });

    await writeFile(this.FILE_NAME, JSON.stringify(posts));
  }

  // blogRepository 의 deletePost 를 구현
  async deletePost(id: string): Promise<void> {
    const posts = await this.getAllPosts();
    const filteredPosts = posts.filter((post) => post.id !== id);
    await writeFile(this.FILE_NAME, JSON.stringify(filteredPosts));
  }

  // blogRepository 의 updatePost 를 구현
  async updatePost(id: string, postDto: Partial<PostDto>): Promise<void> {
    const posts = await this.getAllPosts();
    const postIdx = posts.findIndex((post) => post.id === id);
    posts[postIdx] = {
      id,
      ...posts[postIdx],
      ...postDto,
      updatedDt: new Date(),
    };

    await writeFile(this.FILE_NAME, JSON.stringify(posts));
  }
}


```

> blog.service.ts

```ts

import { BlogFileRepository, BlogRepository } from './blog.repository';
import { Injectable } from '@nestjs/common';
import { PostDto } from './blog.model';

@Injectable()
export class BlogService {
  blogRepository: BlogRepository;

  constructor() {
    this.blogRepository = new BlogFileRepository();
  }

  // 모든 posts 응답
  async getAllPosts() {
    // return this.posts;
    return await this.blogRepository.getAllPosts();
  }

  // 특정 post 응답
  async getPost(id: string) {
    return await this.blogRepository.getPost(id);
  }

  // post 생성 및 모든 posts 응답
  async createPost(postDto: PostDto) {
    await this.blogRepository.createPost(postDto);
  }

  // post 삭제 이후 filteredPost 반환
  async deletePost(id: string) {
    await this.blogRepository.deletePost(id);
  }

  // post 업데이트
  async updatePost(id: string, postDto: Partial<PostDto>) {
    await this.blogRepository.updatePost(id, postDto);
  }
}


```

코드를 보면 알겠지만, 기존의 `service` 로직에서 `repository` 에 저장될 로직만 따로 빼서 만든것으로 보면 된다.

이렇게 하면 `business logic` 상에서 ***데이터를 저장할 로직*** 을 분리하여 처리 가능하도록 구성될 수 있다.

다음은 의존성 주입을 알아본다고 한다.

## 의존성 주입하기

`NestJS` 의 가장 중요한 특징은 바로 `Dependancy Injection` 이다.
현재 까지의 코드는 `Controller`, `Service`, `Repository` 가 의존관계에 있다.

컨트롤러는 서비스를 사용하고, 서비스는 리포지터리를 사용한다.  
각 단계마다 필요한 객체를 사용하려면 생성자에서 객체를 생성한다.  
이는 강한 결합을 가지며, 의존성이 많다면, 수십 수백 클래스에 대한 의존성을  
해결해야만 한다.  

직접 생성하는 방법은 좋은 방법이 아니며, 이를 해결하기 위해서는 `Inversion Of Control` 원칙을 사용한다.

이는 객체 생성을 개발자가 제어하는 영역이었지만 이 영역을 프레임워크에 맡기는 거다.

이는 말그대로 ***제어의 역전(`Inversion Of Control`)*** 이다.
제어를 개발자가 하는것이 아니라 다른 프레임워크에 맡겨서 자동으로 처리하도록  
하는것이다.

이는 위처럼 신경써야한 부분을 알아서 처리해주기에, 개발자가 개발에만 신경쓸수 있도록 해준다.

> 이번 같은 경우는 `의존하는 수십, 수백개의 객체` 를 직접 선언하지 않고,  
> `Dependancy Injection` 을 사용하여 처리하도록 한다.
>
> 즉, `Inversion Of Control` 을 사용해서 만든것이 `Dependancy Injection` 이다.

`Dependancy Injection` 은 알아서 의존성을 관리해준다.

`NestJS` 에서 의존성 주입을 하는 방법은 간단하다
***주입하고 싶은 클래스에 `@Injectable`*** 을 넣어준다.

여기서는 `Repository` 와  `Service` 가 의존관계를 갖는다.
그러므로, 의존성 객체를 직접 생성하지 않고 선언만 하도록 변경해야 한다.

```ts

// blog.repository.ts
import { ..., Injectable } from '@nestjs/common';

... 

Injectable()
class BlogFileRepository implements BlogRepository { ... }

// blog.service.ts
import { ..., Injectable } from '@nestjs/common';
import { BlogRepository, BlogFileRepository } from './blogRepository';

... 

Injectable()
class BlogService { 
  // blogRepository: BlogRepository;

  // constructor() {
  //   this.blogRepository = new BlogFileRepository();
  // }
  constructor(private blogRepository: BlogFileRepository) {}
  ... 
}
```

여기서 보면 단순하게, `constructor` 에 `blogRepository` 의 `field` 를  
생성한다.

`ts` 에서 `field` 생성시, `constructor` 에 줄여쓰는 방식으로 처리한다.
위는 다음과 같은 코드이다.

```ts

class BlogService {
  private blogRepository: BlogFileRepository;

  constructor(blogRepository: BlogFileRepository) {
    this.blogRepository = blogRepository;
  }
  ...
}

```

보면 알겠지만 `constructor` 에 줄여쓰는것이 편리하다.
이제 `blogService` 를 `blogController` 에 주입한다

```ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { PostDto } from './blog.model';

@Controller('blog')
export class BlogController {
  // BlogService 클래스를 할당할 field
  // blogService: BlogService;
  // constructor() {
  //   // BlogController 를 instance 생성시
  //   // blogService field 에 BlogService class 의 instance 를 생성
  //   this.blogService = new BlogService();
  // }

  constructor(private readonly blogService: BlogService) {
    ...
  }
}

```

의존성 주입을 위해, `AppModule` 에 `Provider` 설정을 추가한다.

```ts

import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogFileRepository } from './blog.repository';

@Module({
  imports: [],
  controllers: [BlogController],
  providers: [BlogService, BlogFileRepository],
})
export class AppModule {}


```

이제, 쉽게 한곳에서 ***의존성 주입*** 을 처리할수 있게 되었다.

## MongoDB 연동하기

연동하기 위해 기본적으로 제공하는 `TypeORM` 을 사용한다.
하지만 `MongoDB` 에서 보통 사용하는 라이브러리는 `Mongoose` 를 사용한다.  

`NestJS` 에서 역시 `Mongoose` 를 사용할수 있도록 제공한다.

```sh
npm i @nestjs/mongoose mongoose;
```

> blog.schema.ts

```ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Blog 타입 이면서 MongoDB 의 도큐먼트인 타입 생성
// & 인 교차타입을 사용하서 만든다
export type BlogDocument = Blog & Document;

// Schema 를 사용해서 만들어질 모델을 정의한다
@Schema()
export class Blog {
  // @Prop 은 모델의 프로퍼티임을 나타낸다
  @Prop()
  id: string;

  @Prop()
  title: string;

  @Prop()
  content: string;

  @Prop()
  name: string;

  @Prop()
  createdDt: Date;

  @Prop()
  updatedDt: Date;
}

// SchemaFactory.createForClass 함수를 사용해서 스키마를 생성한다.
export const BlogSchema = SchemaFactory.createForClass(Blog);
```

다음은 `mongodb` 를 사용하는 `repository` 를 추가한다

```ts

// MongoRepository 생성
@Injectable()
export class BlogMongoRepository implements BlogRepository {
  // Mocel<BlogDocument> 타입인 blogModle 주입
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>) {}

  // 모든 게시글을 읽어오는 함수
  async getAllPosts(): Promise<Blog[]> {
    return await this.blogModel.find().exec();
  }

  // 특정 게시글 읽어오는 함수
  async getPost(id: string): Promise<PostDto> {
    return await this.blogModel.findById(id);
  }

  // 게시글 작성
  async createPost(postDto: PostDto): Promise<void> {
    const createPost = {
      ...postDto,
      createdDt: new Date(),
      updatedDt: new Date(),
    };
    await this.blogModel.create(createPost);
  }

  // 게시글 업데이트
  async updatePost(id: string, postDto: Partial<PostDto>): Promise<void> {
    const updatePost = { id, ...postDto, updatedDt: new Date() };
    await this.blogModel.findByIdAndUpdate(id, updatePost);
  }

  // 게시글 삭제
  async deletePost(id: string): Promise<void> {
    await this.blogModel.deleteOne({ id });
  }
}

```

이제 `blogService` 를 변경한다

```ts

@Injectable()
export class BlogService {
  blogRepository: BlogRepository;

  constructor() {
    this.blogRepository = new BlogMongoRepository();
  }
  ...
}


```

다음으로 `Provider` 및 `MongooseModule` 을 `imports` 해서 설정해준다.

```ts

import { Module } from '@nestjs/common';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogFileRepository } from './blog.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blog.schema';

@Module({
  imports: [
    // MongoeDB 전역연결 설정
    MongooseModule.forRoot('mongodb://root:example@localhost:27017', {
      dbName: 'blog',
    }),
    // MongoDB 의 특정 기능 모듈을 사용할 모델을 설정
    // Blog 모델을 Blog DB 에 등록
    // 이때 name 을 Blog.name 으로 설정한다
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
  ],
  controllers: [BlogController],
  providers: [BlogService, BlogFileRepository],
})
export class AppModule {}


```