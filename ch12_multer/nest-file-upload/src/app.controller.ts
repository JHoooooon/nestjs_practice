import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import { multerOption } from './multer.options';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('file-upload')
  // interceptor 사용
  // FileInterceptor 는 클라이언트의 요청에 따라 파일명이 file 인 파일이
  // 있는지 확인한다
  @UseInterceptors(FileInterceptor('file'))
  fileUpload(@UploadedFile() file: Express.Multer.File) {
    console.log(file.buffer.toString('utf-8'));
    return `File Upload`;
  }

  @Post('file-upload-storage')
  @UseInterceptors(FileInterceptor('file', multerOption))
  fileUploadStorage(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
    return 'File Upload';
  }
}
