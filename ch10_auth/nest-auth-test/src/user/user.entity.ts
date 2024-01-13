import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Entity 데커레이터
@Entity()
// User Entity 클래스
export class User {
  // 자동증가 primary 컬럼
  @PrimaryGeneratedColumn()
  id?: number;
  // unique 컬럼
  @Column({ unique: true })
  email: string;
  // 컬럼
  @Column()
  password: string;
  // 컬럼
  @Column()
  username: string;

  // type 이 datetime 인 컬럼
  // 기본값을 넣어준다
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdDt: Date = new Date();
}
