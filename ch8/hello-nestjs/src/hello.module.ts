import { Module } from "@nestjs/common";
import { HelloController } from "./hello.controller";

// 모듈을 설정한다.
@Module({
  // 모듈에서 사용할 controller 를 배열로 할당한다.
  controllers: [HelloController],
})
// 해당 모듈 데커레이터가 실행될 클래스를 생성하고 내보낸다.
export class HelloModule {}
