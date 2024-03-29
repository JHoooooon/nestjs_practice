# OAuth

`OAuth` 는 `Open Authorization` 의 약자이다.
`2006` 년 구글과 트위터가 만든 개방형 인가의 표준이다.

이는 바로 소셜로그인 기능이다. 이는 유저가 해당 웹사이트에 가입한  
`ID` 와 `Password` 대신 다른 사이트에 있는 유저의 정보를 사용해 인증하는  
것이다.

인증을 구현하는데 `OAuth` 를 많이 사용한다.
`OAuth` 는 인증이 아니라 인가의 관점에서 보아야 한다.

> 실상 인증에 대한 관리는 해당 쇼셜 로그인에서 처리해주며,  
우리가 다루는것은 인가쪽에 치우치기는 한것 같다

일단 `OAuth` 에 대해 알기 위해서는 다음과 같은 개념을 알아야 한다고 한다.

- **인증**: 리소스에 접근 자격이 있는지 검증하는 과정  
`OAuth` 에서 리소스는 보호된 정보를 의미한다.
<br/>
- **인가**: 자원에 접근할 권한을 부여하는 과정  
인가가 완료되면 리소스의 접근 권한 정보가 있는 엑세스 토큰을 클라이언트에 보낸다.
<br/>
- **엑세스 토큰**: 리소스 서버에서 리소스 소유자의 보호된 정보를 획득할 때  
사용하는 만료기간이 있는 토큰
<br/>
- **리프레시 토큰**: 엑세스 토큰이 만료되었을 때, 갱신하는 용도로 사용하는  
토큰이다. 엑세스 토큰보다 만료 기간을 길게 가져간다.
<br/>
- **리소스 소유자**: 리소스는 사용자의 보호된 정보를 말하며, 이런 정보에  
접근하도록 자격을 부여하는 사람을 말한다.
<br/>
- **클라이언트**: 리소스를 사용하려고 접근을 요청하는 애플리케이션을 의미한다.
<br/>
- **리소스 서버**: 사용자의 보호된 자원을 가진 서버
<br/>
- **인가 서버**: 인증/인가를 수행하는 서버로, 클라이언트의 접근 자격을  
확인하고 엑세스 토큰을 발급해 권한을 부여한다.

책에서 인가 서버와 리소스 서버 조합을 `OAuth2.0` 프로파이더라고 부른다고 한다

## OAuth 프로토콜 흐름

```sh

------------                    -------------------
           |  인가 요청         |                 |
           | ---------------->  |                 |
           |                    |  Resorce Owner  |
           |  인가 승인 요청    |                 |
           | <----------------  |                 |
           |                    --------------------
           |
           |                    -------------------
           |  리소스 소유자로   |                 |
           |  부터 받은 정보로  |                 | 
           |  엑세스 토큰 요청  |                 |
           | -----------------> |  Authorization  |
           |                    |      server     |
           |  엑세스 토큰 발급  |                 |
           | <----------------- |                 |
  client   |                    -------------------
           |
           |                    -------------------
           |                    |                 |
           |  엑세스 토큰으로   |                 | 
           |  보호된 자원 요청  |                 |
           | -----------------> |     resource    |
           |                    |      server     |
           |  보호된 자원의     |                 |
           |  정보를 응답       |                 |
           | <----------------- |                 |
           |                    -------------------
           |
------------
```

1. 클라이언트가 리소스 소유자에게 권한 부여를 요청한다.
2. 클라이언트는 권한 부여를 받는다. 권한 부여 유형은 총 4가지이다.
인가 코드(`Authorization code`) 사용
암묵적(`implicit`) 방법
리소스 소유자의 암호 자격 증명(`Recource Owner Password Credentials`)
클라이언트 자격증명(`Client Credentials`)
3. 클라이언트는 `resource owner` 로 부터 받은 정보를 통해 엑세스토큰을  
인가 서버에 요청
4. 해당 정보가 요휴하다면, 엑세스 토큰 발급
5. 클라이언트는 `resource server` 에 엑세스 토큰으로 `resource` 요청
6. `resource server` 는 엑세스 토큰이 유효하다면 `resource` 응답

### 엑세스 토큰을 재발행하는 흐름

엑세스 토큰만료시 리프레쉬 토큰을 통해 다시 엑세스토큰을 발급하는 과정이다.

```sh

---------------------------------------------------------------------------
                                      client
---------------------------------------------------------------------------
    |         ^               |       ^       |       ^          |      ^
    |         |               |       |       |       |          |      |
    |         |               |       |       |       |          |      |
    |         |               |       |       |       |          |      |
    |         |             엑세스  보호된  만료된  요효하지     |      |
    |         |             토큰    리소스  엑세스    않은       |      |
    |         |             전달     응답  토큰전달 토큰에러     |      |
    |         |               |       |       |       |          |      |
    |         |               |       |       |       |       리프레시 새로운
    |         |               v       |       v       |         토큰   엑세스
    |       엑세스 토큰과   ----------------------------        전달   토큰
    |       리프레시 토큰   |      리소스 서버         |         |     발급
    |       발급            ----------------------------         |      |
    |         |                                                  |      |
인가승인      |                                                  |      |
    |         |                                                  |      |
    |         |                                                  |      |
    |         |                                                  |      |
    v         |                                                  v      |
---------------------------------------------------------------------------
                          authorization server
---------------------------------------------------------------------------

```

이는 처음 `authorization server` 에 인가승인을 요청한다.
이를 통해 `access token` 및 `refresh token` 을 발급 받게 되고,
이후 `resource server` 에 `access token` 이 만료될때까지 보호된 `resorce` 를  
받게 된다.

만약, 시간이 만료 되거나, 혹은 새로고침(`react 에서 access token 을 전역 상태로 관리할때`) 하는 경우, `token 만료` 및 `token` 이 삭제 되는 상황이 발생한다.

이때, `client` 에서는 `refresh token` 이 있다면, 이 `refresh token` 으로  
새로운 `access token` 을 발급받도록 `authorization server` 에 요청해야 한다.

`refresh token` 에 문제가 없다면, `access token` 을 발급받아 사용하게 된다.
