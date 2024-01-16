import { AuthService } from './auth.service';
import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class LoginGuard implements CanActivate {
    private readonly authService;
    constructor(authService: AuthService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
declare const LocalAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class LocalAuthGuard extends LocalAuthGuard_base {
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export declare class AuthenticateGuard implements CanActivate {
    canActivate(context: ExecutionContext): any;
}
declare const GoogleAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class GoogleAuthGuard extends GoogleAuthGuard_base {
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export {};
