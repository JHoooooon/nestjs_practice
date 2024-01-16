export declare class LoginUserDto {
    email: string;
    password: string;
}
export declare class CreateUserDto extends LoginUserDto {
    username: string;
}
export declare class UpdateUserDto {
    username: string;
    password: string;
}
