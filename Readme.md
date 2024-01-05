# NestJS

> 한번 nestjs 훑어보고 개념 공부를 위해 `Node.js 백엔드 개발자 되기` 를 훑어본다.
>
> `express` 부분은 넘어가고 `nestjs` 관련 부분만 내용을 정리한다.
> 아무래도 `nestjs` 는 잘 만들어진 구조를 강제하다 보니 이에 대한 개념을 알아보는것은 중요하다.
>
> 개념적으로는 아무래도 책으로 습득하는게 잘 와닿는다.

`nestjs` 는 이러한 특징이 있다고 한다.

1. 타입스크립트를 지원한다.

2. `HTTP` 요청 부분을 추상화된 코드를 통해 `Express` 와 `Festify` 를 사용한다.

> 이는 기본적으로 `Express` 를 기반으로 해서 이를 구조화시킨 라이브러리 라고 보면된다.
>
> 이는 `Nest` 가 `Express` 의 `wrapper` 라고 볼 수 있으며,
> `Festify` 를 사용하여 변경가능하다.
>
> `Fastify` 는 기존의 `Express` 나 `hapi` 에 영감을 받은 라이브러리 이며,
> 더 빠른 속도를 제공한다고 한다.
>  

`Nestjs` 가 주목받는 가장 큰 이유는 아키텍처 문제를 잘 해결하기 때문이다.

> `Express` 는 이러한 아키텍처를 고정하지 않고, 자유롭게 설정 가능하다.
> 고정되지 않는다는건 그만큼 협업에 좋지 않을 여지가 있으며,
> 이러한 아키텍처를 지원하기 위해 추가적인 코드로 구현해야 한다.
>
> 그 과정을 잘 알려진 효율적인 아키텍처를 사용하여 코드를 구조와 시킬수 있도록
> 한것이 `Nestjs` 이다.

아키텍처는 쉽게 테스트하고, 확장 가능하며, 각 모듈간의 의존성을 줄이도록
하는 구조를 말한다.

이러한 아키텍처 구조는 유지보수하기 좋으며 목표 달성에 도움을 준다

