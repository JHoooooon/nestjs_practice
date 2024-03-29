# 웹소켓

시작하기 전에 웹소켓에 대한 간단한 정리가 필요하다.
일반적으로, 웹 소켓의 등장이유는 `HTTP` 가 단방향 통신만  
가능하다는 점이다.

예를 들어서, `Client` 가 요청을 해야만 `Server` 는 응답을 해준다.
이는 `Client` 가 요청을 해야하는 상황이 있어야 응답을 해준다는  
것이다.

`Server` 는 이러한 요청이 없으면 응답을 해줄 수 없다.
하지만, 현대에 들어서는 `Client` 의 요청없이도, `Server` 로부터  
응답을 받을 수 있는 방식의 필요함을 느꼈나보다.

이는 실시간으로 변경되는 영화 좌석같은, 혹은 티켓 예매같은 것들이  
하나의 예가 될수 있다.

 `Client` 가 요청을 보내지 않더라도, `Server` 에서 변경이  
일어나면, 변경사항을 `Client` 들에게 알려준다.

이것이 바로 `WebSocket` 의 등장이유이다.
`WebSocket` 은 양방향 통신 프로토콜(`bidirectional communication protocol`)이라고 한다.
> `Full-duplex communication protocol` 이라고도 한다.

`WebSocket` 은 `IE9` 이후에서 부터 사용가능하며, 이전에는  
전혀 다른 방식으로 구현했다고 한다.

이러한 방식으로는 `polling` 과 `long-poling` 이 있다.

***Polling 방식***

`Poling` 은 `Client` 에서 주기적으로 `Server` 에 요청을 보내는  
방식이다. 가장 원초적인 방식으로, 단점으로는 `Server` 로 부터  
받을 데이터가 없는데도 주기적으로 요청을 보내야 한다는 것이다.

`Server` 입장에서는 좋은 선택은 아닌듯하다.

***Long-Poling 방식***

`Long-Poling` 은 `Server` 에서 `Client` 에서 요청에 대한 응답을  
보내지 않고 `pending`(대기)하는 방식이다.  
이는 `Server`에서 응답을 대기하고 있기 때문에, `Server`에서  
보낼 데이터 변경이 일어나면 `Client` 에게 보낼수 있는 장점이 있다.

이를 통해 `Client` 는 응답을 받고 나서 다시 `Server` 에 요청을  
보내고 `Server` 는 `pending` 한다.

이는 `Poling` 보다는 부담이 덜하지만, `Event` `term` 이 적다면  
성능상 `Poling` 과 동일한 상황이 발생할 수 있다.

***WebSocket***

`websocket` 은 위처럼 발생하는 단방향 통신 (`unidirectional conmmunication`) 에 대한 대책으로 만들어졌다.  

`websocket` 은 `Server` 와 `Client` 간에 커넥션이 맺어지면(`handshake`),  
이후에는 `Server` 와  `Clinent` 사이에서 양방향으로 통신이  
이루어질 수 있도록 만들어진 새로운 프로토콜이다

> `HTML5` 표준안으로 `WebSocket APIs` 가 있다고 한다.

게다가, `XMLHttpRequest` 방식으로 `JSON` 을 받아와 `DOM` 을  
업데이트 하면 되므로, `Page` 를 `refresh` 할 필요없이  
사용가능하다.

이는 **실시간성** 을 요구하는 애플리케이션에서 필수적으로  
사용되는 중요한 프로토콜이다.

아래는 `WebSocket` 이 `Client` 와 `Server` 사이의 통신  
흐름을 말한다.

```sh

Client   ----------- HTTP 로 ----------->  Server
   |     <--------- 핸드쉐이크 ----------    |
   |                                       | 
   |                                       |
   |     <----- 웹소켓으로 양방향 통신 ---->    |
   |                                       | 
   |                                       |
   |     ----------> 접속 끊기 <---------    |

```

***HTTP Handshake***

`HTTP 요청`

```sh

GET /chat HTTP/1.1
Host: Server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbCBsZSBub25jZQ==
Origin: http://example.com
Sec-WebSocket-Protocol: chat, superchat
Sec-WebSocket-Version: 13

```

`HTTP` 요청 메시지이다.

첫번째 라인은 `start line` 으로 `method`, `server route`, `HTTP version` 으로 나누어진다.

여기서 주의깊게 봐야할점은 `GET` 요청을 보내고 있다는 것이다.
기본적으로 `Handshake` 는 `GET` 으로 요청을 해야 한다고 말한다.

`Upgrade` 는 현재 프로토콜(`HTTP`) 에서 업그레이드될 프로토콜(`WebSocket`) 을 지정하는 `field` 이다.

`Connection field` 는 `Upgrade` 가 있다면 같이 명시해야 한다
`Sec-WebSocket-Key` 는 클라이언트의 키를 생성해서 보낸다.  
이는 `Client` 식별자 역할을 한다.

`Origin` 은 `Client` 의 주소이다.

`Sec-WebSocket-Protocol` 은 `Client` 가 요청하는 `sub-protocol` 이다.
이는 순서에 따라서 우선순위가 결정되며, `Server` 에서 여러 프로토콜  
이나 프로토콜 버전을 나눠서 서비스할 때 필요한 정보이다.

`HTTP 응답`

```sh

HTTP/1.1 101 Switching Protocol
Upgrade: websocket
Connection: Upgrade
Set-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
Sec-WebSocket-Protocoal: chat

```

이는 `HTTP` 응답 메시지이다.

첫번째는 `status line` 으로 현재 응답에 대한 상태를 나타낸다
대략 `Protocal` 이 변경되었다는 뜻이다.
`HTTP` 에서 `WebSocket` 으로 변경되었으니 앞으로 `scheme` 은  
`ws` 로 통신한다.
> `HTTPS` 로 통신되었다면 `wss` 로 통신해야 한다.

`Upgrade` 와 `Connection` 의 설명은 요청 메시지와 동일하다

`Set-WebSocket-Accept` 는 `Client` 의 `Set-WebSocket-Key` 에 대한  
계산된 결과값이다.
이 값은 `Client` 와 `Server` 간의 통신인증에 사용된다.

***웹 소켓 양방향통신: WebSocket frame***

`WebSocket` 의 데이터는 메시지라 부르며 메시지는 프레임의 모음
이다.

다음을 보자

```sh
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+

```

프레임은 바이트의 배열이며, 위와 같은 형태를 띈다
프레임은 헤더와 페이로드로 이루어져 있으며, 헤더는 `FIN` 부터 `Masking-key` 까지 이루어져있다.

나머지는 `Payload` 의 `Data` 이다.
그럼 `Header` 각 부분에 대해서 정리해본다

| 이름 | 설명 |
| :--- | :--- |
| `FIN` | 1 이면 마지막 프레임이고, 0 이면 데이터가 더 있다는 의미 |
| `RSVI-3` | `Reserved bits` 의 약자이며 확장을 위해 준비한 비트,<br/>보통은 0 으로 둔다. |
| `opcode` | Operation code 의 약자이며 페이로드의 타입을 의미 <br/>4비트로 이루어져있다<br/> `0001`: 텍스트<br/> `0010`: 바이너리<br/>`1000`: 커넥션 종료<br/>`1001`: ping<br/>`1010`: pong<br/>나머지는 미래를 위해 남겨두었다고 한다.|
| `MASK` | 데이터를 마스킹할지 말지 결정하는 값<br/>`1`: 사용<br/>`0`: 미사용 |
| `Payload Len` | 전송할 데이터의 길이를 알려주는 값<br/>`7`,`16` 또는 `64` 일수 있다 <br/> `payload` 의 길이에 따라 3가지로 변경된다.<br/>`payload` 가 `125byte` 이하이면 `7bit` <br/>`payload` 가 `126-65535byte` 이면 `16bit`<br/>`payload` 가 `65536byte` 이상이면 `64bit` <br/> `payload` 의 최대길이는 16엑사바이트이다.|
| `Masking-key` | `MASK` 비트가 `1` 이면 `4byte` 를 사용해서<br/>마스킹 키를 설정한다<br/>이 값은 각 메시지마다 랜덤하게 생성된다<br/>마스킹 키가 있는 경우 `payload` 를 `4byte` 단위로 `XOR` 연산된 데이터를 클라이언트로 보낸다<br/>클라이언트에서는 같은 마스킹 키로 한번 더 `XOR` 연산을 하면 원본 데이터가 나오게 된다. |

이렇게 전부 처리가 이루어진후, `HTTP` 를 통한 `WebSocket` 통신은  
`opcode` 에 `1000` 을 담아 보낸후 종료한다.

웹소켓은 단순하게 데이터를 전송하는것만 지원하며, 여러 필요한부분은  
개발자가 만들어주어야 한다.

이러한 부분마저 편리하게 사용가능한 라이브러리가 있는데  
`Socket.io` 가 있다.

`NestJS` 에서는 이러한 `Socket.io` 를 사용하여 애플리케이션을  
구현해보도록 한다.

