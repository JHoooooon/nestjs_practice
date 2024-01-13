import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; // repository 주입 helper 데커레이터
import { User } from './user.entity'; // User 엔티티
import { Repository } from 'typeorm'; // typeorm Repository 타입
import { CreateUserDto, UpdateUserDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(
    // User Repository 를 주입
    // userRepository 의 타입은 typeorm 의 Repository<User>
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  // user 생성
  async createUser(user: CreateUserDto): Promise<User> {
    return this.userRepository.save(user);
  }

  // user 찾기
  async findUser(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email } });
  }

  // user 업데이트
  async updateUser(email: string, _user: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    user.username = _user.username;
    user.password = _user.password;
    // save 메서드를 사용하여, db 에 저장
    // 만약 user 가 존재한다면 `update` 되고
    // 아니라면 `insert` 된다
    return this.userRepository.save(user);
  }

  // user 삭제
  async deleteUser(email: string) {
    // delete 한다.
    // `deletedResult` 를 반환한다
    // `remove` 는 `remove` 된 `entity` 를 반환한다.
    return this.userRepository.delete({ email });
  }
}
