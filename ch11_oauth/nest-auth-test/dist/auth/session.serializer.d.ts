import { UserService } from './../user/user.service';
import { PassportSerializer } from '@nestjs/passport';
export declare class SessionSerializer extends PassportSerializer {
    private readonly userService;
    constructor(userService: UserService);
    serializeUser(user: any, done: (err: Error, payload: any) => void): void;
    deserializeUser(email: string, done: (err: Error, payload: any) => void): Promise<void>;
}
