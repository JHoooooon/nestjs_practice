import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Blog 타입 이면서 MongoDB 의 도큐먼트인 타입 생성
// & 인 교차타입을 사용하서 만든다
export type BlogDocument = Blog & Document;

// Schema 를 사용해서 만들어질 모델을 정의한다
@Schema()
export class Blog {
  // @Prop 은 모델의 프로퍼티임을 나타낸다
  @Prop()
  id: string;

  @Prop()
  title: string;

  @Prop()
  content: string;

  @Prop()
  name: string;

  @Prop()
  createdDt: Date;

  @Prop()
  updatedDt: Date;
}

// SchemaFactory.createForClass 함수를 사용해서 스키마를 생성한다.
export const BlogSchema = SchemaFactory.createForClass(Blog);
