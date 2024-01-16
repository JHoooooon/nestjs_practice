import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from 'src/user/user.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(userDto: CreateUserDto): Promise<import("../user/user.entity").User>;
    login(user: LoginUserDto, res: any): Promise<any>;
    login2(req: any, res: any): Promise<any>;
    login3(req: any): Promise<any>;
    testGuard(): Promise<string>;
    testGuardWithSession(req: any): Promise<any>;
    googleAuth(): Promise<void>;
    googleAuthRedirect(req: any, res: any): Promise<any>;
}
