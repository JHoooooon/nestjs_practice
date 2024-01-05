// nestjs 의 대부분의 사용 함수는 @nestjs/common 에 있다
// decorator 역시 함수이다.
import { Controller, Get } from "@nestjs/common";

// Controller decorator 는 매개변수로 경로지정이 가능하다
@Controller()
// export 를 통해 해당 Controller 를 내보낸다
export class HelloController {
  // Get Decorator 는 HTTP 요청 중 GET 을 처리한다
  @Get()
  hello() {
    return `Hello NestJs!!`;
  }
}
