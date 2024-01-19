# NEST_CHAT 어플리케이션

처음으로, `nestjs` 에서 사용하도록 패키지를 설치한다

```sh

npm i @nestjs/websockets @nestjs/platform-socket.io
npm i -D @types/socket.io

```

이후 `main.ts` 에 정적파일을 읽을수 있도록 설정한다

`main.ts`

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  // app 에서 ExpressAplication 에 대한 타입을 제네릭으로 지정한다.
  // 지정하지 않을시 app 에서 타입을 찾지 못한다.
  // 현재 여기에선 useStatecAssets 을 사용하므로,
  // 해당 타입을 쉽게 찾기 위해 제네릭으로 명확하게 타입지정해준다
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // express 자체에서 제공하는 staticAssets 를 사용할수도 있다.
  // 이는 정적 폴더를 간단하게 설정한다.
  // server-static 은 복잡한 구현시 사용하기 좋다
  app.useStaticAssets(join(__dirname, '..', 'static'));

  await app.listen(3000);
}
bootstrap();
```

`index.html` 을 간단하게 작성한다.

`static/index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nest Chat</title>
  </head>
  <body>
    <div id="chat">Nest Chat</div>
  </body>
</html>
```

## 서버측 작업을 위한 게이트웨이 만들기

`NestJS` 에서는 웹 소캣을 사용한 통신을 받아주는 클래스를  
게이트웨이라고 부른다.

게이트웨이를 사용하면 의존성 주입, 데커레이터, 필터, 가드 등의  
`NestJS` 기능을 사용할 수 있다.

단순하게 말하면 프로토콜이 `HTTP` 라면 컨트롤러로 부터 요청을  
받고, 프로토콜이 `ws` 라면 게이트웨이로 부터 요청을 받는 차이다

게이트웨이를 만드는 방법은 쉽다
`@WebSocketGateWay()` 데커레이터를 클래스에 붙이면 해당  
클래스는 게이트웨이 역할을 한다

`nest-cli` 를 통해서 생성가능한데 다음의 코드를 입력한다.

```sh

nest g gateway chat;

```

`chat.gateway.ts`

```ts
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
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
    this.server.emit(
      'message',
      `client-${client.id.substring(0, 4)}: ${payload}`,
    );
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
```

이를 통해 게이트웨이를 생성했다

### 게이트웨이를 모듈에 등록

간단하다. `appModule` 에 `gateway` 를 `providers` 로 등록하면 된다.

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatGateway } from './chat/chat.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ChatGateway],
})
export class AppModule {}
```

여기서 중요한 점은, `controllers` 가 아니라 `providers` 에  
등록하는 것이다.

게이트웨이는 다른 클래스에 주입해서 사용할수있는 프로바이더이다.
이제 사용을 위해 `html` 을 작성한다

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nest Chat</title>
  </head>
  <body>
    <h2>Simple Nest Chat</h2>
    <div id="chat"></div>
    <input
      type="text"
      name="message"
      id="message"
      placeholder="메시지를 입력해주세요."
    />
    <button onclick="sendMessage()">전송!!!</button>
  </body>
  <script src="http://localhost:3000/socket.io/socket.io.js"></script>
  <script>
    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
      console.log('connected');
    });

    function sendMessage() {
      const message = document.querySelector('#message').value;
      console.log(message);
      socket.emit('message', message);
    }

    socket.on('message', (message) => {
      const chat = document.querySelector('#chat');
      const div = document.createElement('div');
      div.innerHTML = message;
      chat.appendChild(div);
    });
  </script>
</html>
```

이는 `socket` 을 불러오고, `connect` 한다음,
`sendMessage` 를 보내면, 이후 서버로 부터 받은 `message` 를  
받아 `#chat` 에 넣는 로직이다.

이는 매우 단순한 로직이다.

`socket.io` 의 좋은 점은 `room` 기능을 제공한다는데 있다
채팅방별로 메시지를 통신해야 하므로 네임스페이스도 같이 사용한다.

해당 네임스페이스는 네임스페이스에 지정된 곳에서만 이벤트를  
발생시키고 메시지를 전송하는 개념이다.

`namespace` 은 `slack` 의 `workspace` 이고, `room` 은 채팅 방이라고  
보면 된다.

## 네임 스페이스

서버와 클라이언트는 실제적으로 하나의 연결(`HTTP` 혹은 `WebSocket`)  
만을 사용한다.

**하나의 연결을 로직으로 나눠서 사용할 수 있게 한것이 네임스페이스이다.**

사용자가 채팅방에 입장하기 전에 메시지를 주고 받는 내용은  
`chat` 네임스페이스의 `message` 이벤트를 사용하며,  
채팅방에 입장후에는 `room` 네임스페이스의 `message` 이벤트를  
사용할 수 있다

이를 사용하기 위해서는 `WebSocketGateway` 를 수정한다.

```ts
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

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: any): void {
    console.log(client.id.length);
    this.server.emit(
      'message',
      `client-${client.id.substring(0, 4)}: ${payload}`,
    );
  }
}
```

위처럼 `chat` 네임스페이스를 설정하고, `html` 상에서도,  
`io` 부분의 `url` 의 끝에 `/chat` 을 붙혀야 한다.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nest Chat</title>
  </head>
  <body>
    <h2>Simple Nest Chat</h2>
    <div id="chat"></div>
    <input
      type="text"
      name="message"
      id="message"
      placeholder="메시지를 입력해주세요."
    />
    <button onclick="sendMessage()">전송!!!</button>
  </body>
  <script src="https://code.jquery.com/jquery-3.6.1.slim.js"></script>
  <script src="http://localhost:3000/socket.io/socket.io.js"></script>
  <script>
    const socket = io('http://localhost:3000/chat');
    // `/chat` 네임스페이스에 접근

    socket.on('connect', () => {
      console.log('connected');
    });

    function sendMessage() {
      const message = document.querySelector('#message').value;
      console.log(message);
      socket.emit('message', message);
    }

    socket.on('message', (message) => {
      const chat = document.querySelector('#chat');
      const div = document.createElement('div');
      div.innerHTML = message;
      chat.appendChild(div);
    });
  </script>
</html>
```

마치 `http` 의 `url` 접근과 비슷하다.
이렇게 하면 `socket.io` 는 생성된 `chat` 의 경로를 사용하여  
네임스페이스를 지정하고, 접근한다.

### 닉네임 추가

닉네임을 추가한다

`index.html script`

```ts
const socket = io('http://localhost:3000/chat');
const nickname = prompt('닉네임을 입력해주세요.');

socket.on('connect', () => {
  console.log('connected');
});

function sendMessage() {
  const message = document.querySelector('#message').value;
  console.log(message);
  socket.emit('message', { message, nickname });
}

socket.on('message', (message) => {
  const chat = document.querySelector('#chat');
  const div = document.createElement('div');
  div.innerHTML = message;
  chat.appendChild(div);
});
```

이렇게 하면 `server` 로 `nickname` 값과 `message` 를 객체로  
보낸다

`app.gateway.ts`

```ts

  handleMessage(client: Socket, payload: any): void {
    client.broadcast.emit('message', `${payload.nickname}: ${payload.message}`);
    // payload 의 nickname 과 message 전달
    // this.server.emit 은 모든 `client` 에 전달하고,
    // socket.broadcast.emit 은 전송을 요청한 클라이언트를
    // 제외한 다른 클라이언트들에게 전송한다
    //
    // 이는 채팅시 내 메시지와 상대방 메시지를 구분하는데
    // 용이하다.
  }


```

이렇게 전달하면 이제 `prompt` 를 통해 전달한 `nickname` 을  
서버에 전달할 수 있다.

이제 채팅방을 생성하기 위해 `html` 을 수정한다.
수정한 `html` 에서는

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nest Chat</title>
  </head>
  <body>
    <h2>Simple Nest Chat</h2>
    <div>
      <h2>채팅방 목록</h2>
      <ul id="rooms"></ul>
    </div>

    <input
      type="text"
      name="message"
      id="message"
      placeholder="메시지를 입력해주세요."
    />
    <button onclick="sendMessage()">전송!!!</button>
    <button onclick="createRoom()">방 만들기</button>

    <div>
      <h2>채팅</h2>
      <div id="chat"></div>
    </div>
  </body>
  <script src="https://code.jquery.com/jquery-3.6.1.slim.js"></script>
  <script src="http://localhost:3000/socket.io/socket.io.js"></script>
  <script src="./script.js"></script>
</html>
```

`script.js`

```ts
const socket = io('http://localhost:3000/chat');
const roomSocket = io('http://localhost:3000/room');
const nickname = prompt('닉네임을 입력해주세요.');

socket.on('connect', () => {
  console.log('connected');
});

function sendMessage() {
  const message = document.querySelector('#message').value;
  console.log(message);
  socket.emit('message', { message, nickname });
}

socket.on('message', (message) => {
  const chat = document.querySelector('#chat');
  const div = document.createElement('div');
  div.innerHTML = message;
  chat.appendChild(div);
});
```

이제 채팅방을 만든다

`script.js`

```js
const socket = io('http://localhost:3000/chat');
const roomSocket = io('http://localhost:3000/room');
const nickname = prompt('닉네임을 입력해주세요.');

socket.on('connect', () => {
  console.log('connected');
});

function sendMessage() {
  const message = document.querySelector('#message').value;
  console.log(message);
  socket.emit('message', { message, nickname });
}

// room 생성하는 함수
function createRoom() {
  const room = prompt('생성할 방의 이름을 입력해주세요.');
  roomSocket.emit('createRoom', { room, nickname });
}

socket.on('message', (message) => {
  const chat = document.querySelector('#chat');
  const div = document.createElement('div');
  div.innerHTML = message;
  chat.appendChild(div);
});

// 클라이언트 측에서 채팅방을 추가하는 함수
roomSocket.on('room', (data) => {
  const rooms = document.querySelector('#rooms');
  rooms.innerHTML = '';
  data.forEach((room) => {
    console.log(room);
    const li = document.createElement('li');
    li.innerHTML = `${room} <button onclick="joinRoom('${room}')">join</button>`;
    rooms.appendChild(li);
  });
});
```

`room` `namespace` 를 생성하고, `createRoom` 호출시  
`createRoom` 이벤트를 실행시킨다.

서버의 구현은 다음과 같다.

```ts
import {
  MessageBody,
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
    // this.server.emit('message', `${payload.nickname}: ${payload.message}`);
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
    client.broadcast.emit('message', `${payload.nickname}: ${payload.message}`);
    // payload 의 nickname 과 message 전달
    // this.server.emit 은 모든 `client` 에 전달하고,
    // socket.broadcast.emit 은 전송을 요청한 클라이언트를
    // 제외한 다른 클라이언트들에게 전송한다
    //
    // 이는 채팅시 내 메시지와 상대방 메시지를 구분하는데
    // 용이하다.
  }
}

@WebSocketGateway({ namespace: 'room' })
// room 네임스페이스 생성
export class RoomGateway {
  rooms = [];
  // rooms 를 담을 배열객체

  @WebSocketServer()
  server: Server;
  // server 인스턴스 사용

  @SubscribeMessage('createRoom')
  // createRoom 구독
  createRoom(@MessageBody() data) {
    // createRoom 핸들러 생성
    const { nickname, room } = data;
    // data 에서 nickname, room 구조분해 할당
    this.rooms.push(room);
    // 배열에 room push
    this.server.emit('room', this.rooms);
    // room 이벤트로 채팅방 리스트 전송
  }
}
```

이제 `room` 을 생성할수 있게 되었다.
해당 `room` 에 `join` 하고, 채팅방에 새로운 유저가 들어온다면  
해당 유저가 들어왔다고 알려주어야 한다.

```html
<div>
  <h2>공지</h2>
  <div id="notice"></div>
</div>
```

공지하는 부분을 `html` 에 추가한다
그리고 `script.js` 에 `joinRoom` 함수를 추가한다

`script.js`

```js

...
let currentRoom = '';

...
function joinRoom(room) {
  roomSocket.emit('joinRoom', { room, nickname, toLeaveRoom: currentRoom });

  currentRoom = room;
}

```

다음은 서버에 `joinRoom` 핸들러 메서드를 생성한다

`app.gateway.ts`

```ts

  @SubscribeMessage('joinRoom')
  // 방입장시 실행되는 핸들러 메서드
  JoinRoomHandler(client: Socket, data) {
    const { nickname, room, toLeaveRoom } = data;
    client.leave(toLeaveRoom);
    this.chatGateway.server.emit('notice', {
      message: `${nickname} 님이 ${room} 방을 나갔습니다.`,
    });
    client.join(room);
  }

```

`sendMessage` 를의 내용을 수정한다.

`script.js`

```ts
// room 에 join
function joinRoom(room) {
  const chat = document.getElementById('chat');
  chat.innerHTML = '';
  roomSocket.emit('joinRoom', { room, nickname, toLeaveRoom: currentRoom });

  currentRoom = room;
}

// message 를 보내는 함수
function sendMessage() {
  // currentRoom 이 없다면 return;
  if (currentRoom == '') {
    alert('방을 선택해주세요.');
    return;
  }
  const message = document.querySelector('#message').value;
  const chat = document.querySelector('#chat');
  const div = document.createElement('div');
  // message 의 value 값과, nickname, room 데이터를 보낼 객체
  const data = { message, nickname, room: currentRoom };

  // div 에 innerHTML 을 사용하여, `message` 생성
  div.innerHTML = `<div>나: ${message}</div>`;
  // div#chat 에 div append
  chat.appendChild(div);
  // roomSocket 의 `message` 핸들러 실행
  roomSocket.emit('message', data);
}

// 채팅방 내에서 대화를 나눌때 사용하는 이벤트
roomSocket.on('message', (data) => {
  const chat = document.querySelector('#chat');
  console.log('data');
  chat.innerHTML = `<div>${data.message}</div>`;
});
```

`script` 수정후 `message` 에 해당하는 핸들러를 생성한다.

```ts

  @SubscribeMessage('message')
  handleMessageToRoom(client: Socket, data) {
    const { nickname, room, message } = data;
    console.log(data);
    // to(방이름).emit(이벤트명, 보내는 메시지) 를
    // 사용하여 해당 room 에 메시지를 boradcast 하는
    // 로직이다.
    // 직관적으로 확인하기 좋다
    client.broadcast.to(room).emit('message', {
      message: `${nickname}: ${message}`,
    });
  }

```

이제 해당 내용을 실행하면 재대로 처리된다.
