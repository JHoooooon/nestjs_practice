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
exports.SessionSerializer = void 0;
const user_service_1 = require("./../user/user.service");
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
let SessionSerializer = class SessionSerializer extends passport_1.PassportSerializer {
    constructor(userService) {
        super();
        this.userService = userService;
    }
    serializeUser(user, done) {
        done(null, user.email);
    }
    async deserializeUser(email, done) {
        const user = await this.userService.findUser(email);
        if (!user) {
            done(new Error('유저가 없습니다.'), null);
        }
        delete user.password;
        done(null, user);
    }
};
exports.SessionSerializer = SessionSerializer;
exports.SessionSerializer = SessionSerializer = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService])
], SessionSerializer);
//# sourceMappingURL=session.serializer.js.map