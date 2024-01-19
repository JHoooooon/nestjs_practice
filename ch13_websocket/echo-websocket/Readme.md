# 메아리 어플리케이션

책에서 동작방법을 알아보았으니, 웹 소켓을 사용해 간단한  
애플리케이션을 만들어 본다.

간단한 `websocket` 어플리케이션이라 `ws` 만 설치한다

```sh
npm i ws;
```

웹 소캣 서버를 생성한다.

`server.js`

```js

const WebSocket = require("ws");
const server = new WebSocket.server({ port: 3000 });

server.on("connection", (ws) => {
  ws.send(`[서버 접속 완료]`);

  ws.on("message", (message) => {
    ws.send(`서버로부터 응답: ${message}`);
  });

  ws.on("close", () => {
    console.log(`클라이언트 접속 해제`);
  });
});

```

다음은 `WebSocket` 의 `Server` 에 대한 이벤트 정리다.

| 이벤트 | 설명 |
| :--- | :--- |
| `close` | 서버가 `close` 될때 발생하는 이벤트 |
| `connection` | `handshake` 완료되면 발생하는 이벤트 |
| `error` | `error` 발생시 발생하는 이벤트 |
| `headers` | 응답의 헤더가 핸드쉐이크로 소켓에 기록되기 전에 발생하는<br/>이벤트, 헤더를 보내기전에 검사, 수정할 수 있다|
| `listening` | 서버가 바인딩되었을때 발생하는 이벤트 |
| `wsClientError` | `WebSocket` 연결되기 전에 에러가 나면 발생하는 이벤트 |

다음은 `WebSocket` 의 이벤트에 대한 정리다

| 이벤트 | 설명 |
| :--- | :--- |
| `close` | 클라이언트가 연결을 닫을때 발생하는 이벤트 |
| `error` | `error` 발생시 발생하는 이벤트 |
| `message` | `message` 를 수신할때 발생하는 이벤트 |
| `open` | 서버와 연결되면 발생하는 이벤트 |
| `ping` | 서버에 `ping` 을 수신하면 발생 |
| `pong` | 서버에 `pong` 을 수신하면 발생 |
| `redirect` | 리디렉션을 하기전에 발생 |
| `unexpected-response` | 서버 응답이 예상한 응답이 아닐때(401) 발생 |
| `upgrade` | 핸드쉐이크에서 서버에서 응답 헤더를 수신할때 발생하는 이벤트 |

이러한 이벤트를 간략하게 정리한다.
굳이 `HTML` 구현까지는 하지 않는다.

이후 `리액트로 배우는 소켓 프로그래밍` 에 대해서 정리할 예정이라  
필요는 없을듯 하다.

중요한건, `NestJS` 에서 `Socket.io` 를 어떻게 적용했는가다.
