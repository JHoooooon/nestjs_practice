import { User } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto } from './user.dto';
export declare class UserService {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    createUser(user: CreateUserDto): Promise<User>;
    findUser(email: string): Promise<User>;
    updateUser(email: string, _user: UpdateUserDto): Promise<User>;
    deleteUser(email: string): Promise<import("typeorm").DeleteResult>;
    findByEmailOrSave(email: string, username: string, providerId: string): Promise<User>;
}
