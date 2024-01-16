import { IsEmail, IsString } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class CreateUserDto extends LoginUserDto {
  @IsString()
  username: string;
}

export class UpdateUserDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
