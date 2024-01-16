import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { SessionSerializer } from './session.serializer';

@Module({
  // PassportModule 등록
  // session 사용을 위해 옵션상 true
  imports: [UserModule, PassportModule.register({ session: true })],
  // LocalStrategy, SessionSerializer 를 프로바이더로 등록
  providers: [AuthService, LocalStrategy, SessionSerializer],
  controllers: [AuthController],
})
export class AuthModule {}
