import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { PostDto } from './blog.model';

@Controller('blog')
export class BlogController {
  // BlogService 클래스를 할당할 field
  // blogService: BlogService;
  // constructor() {
  //   // BlogController 를 instance 생성시
  //   // blogService field 에 BlogService class 의 instance 를 생성
  //   this.blogService = new BlogService();
  // }

  constructor(private readonly blogService: BlogService) {}

  // 모든 게시글 요청
  @Get()
  getAllPosts() {
    // blogService 의 getAllPosts 실행
    return this.blogService.getAllPosts();
  }

  // 게시글 요청
  @Get('/:id')
  getPost(@Param('id') id: string) {
    // blogService 의 getPost 실행
    return this.blogService.getPost(id);
  }

  // 게시글 생성
  @Post()
  createPost(@Body() postDto: PostDto) {
    // blogService 의 createPost 실행
    return this.blogService.createPost(postDto);
  }

  // 게시글 수정
  @Put('/:id')
  updatePost(@Param('id') id: string, @Body() postDto: Partial<PostDto>) {
    // blogService 의 createPost 실행
    return this.blogService.updatePost(id, postDto);
  }

  // 게시글 삭제
  @Delete('/:id')
  deletePost(@Param('id') id: string) {
    // blogService 의 deletePost 실행
    return this.blogService.deletePost(id);
  }
}
