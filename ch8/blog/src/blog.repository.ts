import { Injectable } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';
import { PostDto } from './blog.model';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from './blog.schema';
import { Model } from 'mongoose';

// blogRepository 의 인터페이스 생성
export interface BlogRepository {
  // 모든 posts 응답
  getAllPosts(): Promise<PostDto[]>;
  // 새로운 post 생성
  createPost(postDto: PostDto): Promise<void>;
  // 특정 post 응답
  getPost(id: string): Promise<PostDto>;
  // 특정 post 삭제
  deletePost(id: string): Promise<void>;
  // 특정 post 업데이트
  updatePost(id: string, postDto: Partial<PostDto>): Promise<void>;
}

@Injectable()
// blogRepository 인터페이스를 상속받아 BlogFileRepository 생성
export class BlogFileRepository implements BlogRepository {
  // 사용할 file 경로를 field 로 할당
  FILE_NAME = './src/blog.data.json';

  // blogRepository 의 getAllPosts 를 구현
  async getAllPosts(): Promise<PostDto[]> {
    const datas = await readFile(this.FILE_NAME, 'utf-8');
    const posts = JSON.parse(datas) as PostDto[];
    return posts;
  }

  // blogRepository 의 getPost 를 구현
  async getPost(id: string): Promise<PostDto> {
    const posts = await this.getAllPosts();
    const post = posts.find((post) => post.id === id);
    return post;
  }

  // blogRepository 의 cretaePost 를 구현
  async createPost(postDto: PostDto): Promise<void> {
    const posts = await this.getAllPosts();
    const id = posts.length + 1;
    posts.push({
      id: id.toString(),
      ...postDto,
      createdDt: new Date(),
    });

    await writeFile(this.FILE_NAME, JSON.stringify(posts));
  }

  // blogRepository 의 deletePost 를 구현
  async deletePost(id: string): Promise<void> {
    const posts = await this.getAllPosts();
    const filteredPosts = posts.filter((post) => post.id !== id);

    await writeFile(this.FILE_NAME, JSON.stringify(filteredPosts));
  }

  // blogRepository 의 updatePost 를 구현
  async updatePost(id: string, postDto: Partial<PostDto>): Promise<void> {
    const posts = await this.getAllPosts();
    const postIdx = posts.findIndex((post) => post.id === id);
    posts[postIdx] = {
      id,
      ...posts[postIdx],
      ...postDto,
      updatedDt: new Date(),
    };

    await writeFile(this.FILE_NAME, JSON.stringify(posts));
  }
}

// MongoRepository 생성
@Injectable()
export class BlogMongoRepository implements BlogRepository {
  // Mocel<BlogDocument> 타입인 blogModle 주입
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>) {}

  // 모든 게시글을 읽어오는 함수
  async getAllPosts(): Promise<Blog[]> {
    return await this.blogModel.find().exec();
  }

  // 특정 게시글 읽어오는 함수
  async getPost(id: string): Promise<PostDto> {
    return await this.blogModel.findById(id);
  }

  // 게시글 작성
  async createPost(postDto: PostDto): Promise<void> {
    const createPost = {
      ...postDto,
      createdDt: new Date(),
      updatedDt: new Date(),
    };
    await this.blogModel.create(createPost);
  }

  // 게시글 업데이트
  async updatePost(id: string, postDto: Partial<PostDto>): Promise<void> {
    const updatePost = { id, ...postDto, updatedDt: new Date() };
    await this.blogModel.findByIdAndUpdate(id, updatePost);
  }

  // 게시글 삭제
  async deletePost(id: string): Promise<void> {
    await this.blogModel.findByIdAndDelete(id);
  }
}
