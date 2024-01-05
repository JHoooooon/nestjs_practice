import {
  // BlogFileRepository,
  BlogMongoRepository,
  // BlogRepository,
} from './blog.repository';
import { Injectable } from '@nestjs/common';
import { PostDto } from './blog.model';

@Injectable()
export class BlogService {
  // blogRepository: BlogRepository;

  // constructor() {
  //   // this.blogRepository = new BlogFileRepository();
  // }

  constructor(private readonly blogRepository: BlogMongoRepository) {}

  // 모든 posts 응답
  async getAllPosts() {
    // return this.posts;
    return await this.blogRepository.getAllPosts();
  }

  // 특정 post 응답
  async getPost(id: string) {
    return await this.blogRepository.getPost(id);
  }

  // post 생성 및 모든 posts 응답
  async createPost(postDto: PostDto) {
    await this.blogRepository.createPost(postDto);
  }

  // post 삭제 이후 filteredPost 반환
  async deletePost(id: string) {
    await this.blogRepository.deletePost(id);
  }

  // post 업데이트
  async updatePost(id: string, postDto: Partial<PostDto>) {
    await this.blogRepository.updatePost(id, postDto);
  }
}
