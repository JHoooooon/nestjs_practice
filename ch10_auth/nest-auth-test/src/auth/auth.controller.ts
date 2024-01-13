import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from 'src/user/user.dto';
import { LoginGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  // authService 주입
  constructor(private readonly authService: AuthService) {}

  // Post register 경로 생성
  @Post('/register')
  // user 를 생성할 dto
  async register(@Body() userDto: CreateUserDto) {
    // user 등록
    return await this.authService.register(userDto);
  }

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

  @UseGuards(LoginGuard)
  @Get('test-guard')
  async testGuard() {
    // 로그인되면 아래 글 리턴
    return '로그인된 때만 이글이 보입니다.';
  }
}
