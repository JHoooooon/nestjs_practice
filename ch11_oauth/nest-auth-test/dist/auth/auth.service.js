"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const user_service_1 = require("../user/user.service");
let AuthService = class AuthService {
    constructor(userService) {
        this.userService = userService;
    }
    async register(userDto) {
        const user = await this.userService.findUser(userDto.email);
        console.log(user);
        if (user)
            throw new common_1.HttpException('해당 유저가 이미 있습니다.', common_1.HttpStatus.BAD_REQUEST);
        const encryptedPassword = await bcrypt.hash(userDto.password, 10);
        try {
            const user = await this.userService.createUser({
                ...userDto,
                password: encryptedPassword,
            });
            delete user.password;
            return user;
        }
        catch (error) {
            throw new common_1.HttpException('서버에러', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async validateUser(email, password) {
        const user = await this.userService.findUser(email);
        if (!user) {
            return null;
        }
        const { password: hashedPassword, ...userInfo } = user;
        if (await bcrypt.compare(password, hashedPassword)) {
            return userInfo;
        }
        return null;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService])
], AuthService);
//# sourceMappingURL=auth.service.js.map