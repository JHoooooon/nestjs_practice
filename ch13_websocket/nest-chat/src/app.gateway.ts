import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: 'chat' })
// `namespace` 설정
export class ChatGateway {
  @WebSocketServer() server: Server;
  // 웹소켓 서버 인스턴스에 접근하는 데커레이터
  // 직접 웹소켓 서버 인스턴스를 생성하지 않으므로,
  // 이처럼 접근해야 한다

  @SubscribeMessage('message')
  // `message` 이벤트를 구독하는 리스너
  // 클라이언트로 부터 message 를 받으면 paylaod 값에 데이터가 할당된다
  // client 인자는 웹소켓 연결에 대한 인스턴스이다.
  // SubscribeMessage 데커레이터는 생략가능한데 생략시
  // client 는 @ConnectSocket() 데커레이터를,
  // payload 는 @MessageBocy() 데커레이터를 사용해야 한다.
  handleMessage(client: Socket, payload: any): void {
    this.server.emit('message', `${payload.nickname}: ${payload.message}`);
    // server 인스턴스의 `emit` 을 사용하여,
    // 클라이언트 전체에 `message` 를 보낸다
    // 첫번째 인수는 `message` 이벤트명이고,
    // 두번째 인수는 보내주는 데이터이다.
    //
    // socket.io 에서는 모든 클라이언트 인스턴스에 임의의
    // id 값이 주어진다.
    // 무작위의 문자열이라, 단순화 하기 위해 첫번째 문자열부터
    // 4번째 문자열 앞까지 자른다.
    //
  }
}
