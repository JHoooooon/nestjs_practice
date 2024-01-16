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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const user_dto_1 = require("../user/user.dto");
const auth_guard_1 = require("./auth.guard");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async register(userDto) {
        return await this.authService.register(userDto);
    }
    async login(user, res) {
        const userInfo = await this.authService.validateUser(user.email, user.password);
        if (userInfo) {
            res.cookie('login', JSON.stringify(userInfo), {
                httpOnly: false,
                maxAge: 1000 * 60 * 60 * 24 * 7,
            });
            return res.send(userInfo);
        }
    }
    async login2(req, res) {
        console.log(req.cookies['login'], req.user);
        if (!req.cookies['login'] && req.user) {
            res.cookie('login', JSON.stringify(req.user), {
                httpOnly: false,
                maxAge: 1000 * 60 * 60 * 24 * 7,
            });
            return res.send(req.user);
        }
        throw new common_1.HttpException('이미 로그인된 유저입니다.', common_1.HttpStatus.FORBIDDEN);
    }
    async login3(req) {
        return req.user;
    }
    async testGuard() {
        return '로그인된 때만 이글이 보입니다.';
    }
    async testGuardWithSession(req) {
        return req.user;
    }
    async googleAuth() { }
    async googleAuthRedirect(req, res) {
        const { user } = req;
        return res.send(user);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('/register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('/login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Response)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.LoginUserDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.LoginGuard),
    (0, common_1.Post)('login2'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Response)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login2", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.LocalAuthGuard),
    (0, common_1.Post)('login3'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login3", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.LoginGuard),
    (0, common_1.Get)('test-guard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "testGuard", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthenticateGuard),
    (0, common_1.Get)('test-guard2'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "testGuardWithSession", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.GoogleAuthGuard),
    (0, common_1.Get)('to-google'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.GoogleAuthGuard),
    (0, common_1.Get)('google'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Response)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuthRedirect", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map