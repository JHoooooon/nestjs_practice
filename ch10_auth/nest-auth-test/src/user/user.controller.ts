import { CreateUserDto, UpdateUserDto } from './user.dto';
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

  // user 삭제
  @Delete('/delete/:email')
  // param 으로 email 을 받는다
  async deleteUser(@Param('email') email: string) {
    // deleteUser 호출 및 반환
    return await this.userService.deleteUser(email);
  }
}
