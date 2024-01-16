import { CreateUserDto, UpdateUserDto } from './user.dto';
import { UserService } from './user.service';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    findUser(email: string): Promise<import("./user.entity").User>;
    createUser(user: CreateUserDto): Promise<import("./user.entity").User>;
    updateUser(email: string, user: UpdateUserDto): Promise<import("./user.entity").User>;
    deleteUser(email: string): Promise<import("typeorm").DeleteResult>;
}
