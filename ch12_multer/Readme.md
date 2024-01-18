# 파일업로드

파일업로드를 사용하는데 `nodejs` 진영해서는 보통 `multer` 를  
많이 사용한다.

`multer` 는 파일 업로드를 위해 사용되는 `multipart/form-data` 를  
다루기 위한 `nodejs` 미들웨어이다.

## multer options

`multer` 는 미들웨어로써 사용할 라우트에서 요청을 받은이후,  
`multer` 에 의해 변형한후, 사용할 콜백함수로 요청을 넘겨준다.

이러한 미들웨어는 몇가지 종류가 존재하는데 다음과 같다

```ts
const express = require('express')
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })

const app = express()

app.post('/profile', upload.single('avatar'), function (req, res, next) {
  // req.file 은 `avatar` 라는 필드의 파일 정보입니다.
  // 텍스트 필드가 있는 경우, req.body가 이를 포함할 것입니다.
})

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
  // req.files 는 `photos` 라는 파일정보를 배열로 가지고 있습니다.
  // 텍스트 필드가 있는 경우, req.body가 이를 포함할 것입니다.
})

const cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', cpUpload, function (req, res, next) {
  // req.files는 (String -> Array) 형태의 객체 입니다.
  // 필드명은 객체의 key에, 파일 정보는 배열로 value에 저장됩니다.
  //
  // e.g.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // 텍스트 필드가 있는 경우, req.body가 이를 포함할 것입니다.
})

```

`multer`를 사용하여 `upload` 객체를 만드는것을 볼 수 있다.
이때, `multer` 에 옵션 객체를 받아서 처리하는데 옵션객체는  
아래와 같다

***multer options***
| key | description |
| :--- | :--- |
| `dest` 또는 `storage` | 파일이 저장될 위치 |
| `fileFilter` | 어떤 파일을 허용할지 제어하는 함수 |
| `limits` | 업로드 된 데이터의 한도 |
| `preservePath` | 파일의 `base name` 대신 보존할 파일의 전체경로 |

> `preservePath` 가 약간 뜻이 애매하다.
단순하게 말하면, 사용자가 업로드한 파일의 경로를 보존할지 안할지  
결정하는 옵션이다.  
>
> `preservePath` 가 `true` 라면, `originalPath` 에 값이 채워진다.
>> 여기서 말하는 `originalPath` 는 `multer` 의 각 파일의 파일정보  
중 하나이다.

`.single`, `.array`, `fields` 를 사용하여 받을 `form` 의  
유형을 알려준다.

**.single(fieldname)**:
`fieldname` 인자에 명시된 이름의 단수 파일을 받는다.
이는 `req.file` 에 저장된다.

**.array(fieldname[, maxCount])**:
`fieldname` 인자에 명시된 이름의 파일 전부를 배열로 받는다.  
이는 선택적으로 `maxCount` 를 받는데, 배열의 길이를 설정한다.  
배열의 길이가 `maxCount` 보다 길면 파일 업로드시 에러가 발생한다.  
이는 `req.file` 에 저장된다

**.fields(fields)**:
`fields` 인자에 명시된 여러 파일을 전달받는다. 파일 객체는 배열  
형태로 `req.files` 에 저장된다.  

`fields` 의 형식은 아래와 같이 `fieldname` 과 `maxCount` 가 포함된  
객체이어야 한다.

```ts

[
  {name: 'avatar', maxCount: 1},
  {name: 'gallery', maxCount: 8},
]

```

**.none**:
오직 텍스트필드만 허용한다. 파일 업로드시 `LIMIT_UNEXPECTED_FILE` 과  
같은 에러 코드가 발생한다. 이건 `upload.fields([])` 와 같은 동작이다.

**.any**:
모든 파일을 허용한다. 파일 배열은 `req.file` 에 저장된다.

## storage

저장소를 지정할 수 있다

***DiskStorage***

디스크 스토리지 엔진은 파일을 디스크에 저장하기 위한 모든 제어  
기능을 제공한다.

```ts

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp/my-uploads')
  },
  filename: function (req, file,cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})

const upload = multer({ storage })

```

**`destination`**: 폴더안에 업로드한 파일을 저장할지 결정
> `destination` 함수 사용시, 해당 폴더를 먼저 생성해야 한다.  
기본적으로 `destination` 은 폴더가 존재하는지 먼저 확인하기 때문이다.

**`filename`**: 폴더안에 저장되는 파일 명을 결정하는데 사용
> `filename` 이 주어지지 않는다면, 각각의 파일은 파일 확장자를  
제외한 렌덤한 이름으로 지어질 것이다.

`req` 와 `file` 에 대한 정보를 둘다 받으며, 결과 값으로 `cb` 를  
호출하여 처리한다, `cb` 는 흔한 `nodejs` 의 컨벤션대로, 보통은  
첫번재 인자값으로, `error`를, 두번째 인자값으로 전달할 값을 준다.

***MemoryStorage***

메모리 스토리지 엔진은 파일을 메모리의 `Buffer` 객체로 저장한다.
이러한 방법에 대한 어떤 옵션도 없다고 한다.

## limits

다음의 선택적 속성의 크기 제한을 지정한다.
이 객체는 [busboy](https://github.com/mscdex/busboy#busboy-methods)로 직접 전달한다고 한다.

> `busboy` 는 `form data` 를 파싱하는 `nodejs` 모듈이다.
> 내부적으로 `busboy` 를 사용하여 `form data` 를 처리하는듯 하며  
`bosboy` 의 `limits` 옵션과 `multer` 에서 제공하는 `limits` 객체  
옵션이 동일해 보인다.

- `fieldNameSize`: 필드명 사이즈 최대값 (byte 단위)
- `fieldSize`: 필드값 사이드 최대값 (byte 단위)
- `fields`: 파일형식이 아닌 필드의 최대 개수
- `fileSize`: `multipart` 형식 폼에서 최대 파일 사이즈
- `files`: `multipart` 형식 폼에서 파일 필드의 최대 개수
- `parts`: `multipart` 형식 폼에서 `fields + files` 으로 구성된  
최대 개수

> 솔직히 `parts` 부분은 뭔가 애매한 부분이 있다
> 물론 잘사용하면 되겠지만, `files 와 fields` 를 묶어서 한번에  
처리하는것이 의미적으로 잘 맞는지 애매한것 같다.
> 뭐, `files` 만 처리하는 로직이 아니라 `form fields` 들 처리를  
같이 해야 한다면 필요한 부분이기도 하다.

- `headerPairs`: `multipart` 형식 폼에서 파싱할 헤더의 `key => value`
쌍의 최대 개수

사이즈를 제한하는것은 `Dos` 공격에 좋다고 한다.

## fileFilter

어느 파일을 업로드할지, 혹은 건너띌지 제어할 수있게 함수에 설정

```ts

function fileFilter (req, file, cb) {
  // 파일을 거부
  cb (null, false)
  // 파일을 허용
  cb (null, true)
  // 에러 전달
  cb (new Error('I don\'t have a clue!'))
}

```

## ErrorHandling

에러 발생시 `multer` 는 `express` 에 의임한다고 한다
이말은 `express` 미들웨어를 통해 처리하라는 것이다.

단, `multer` 를 사용하여 커스텀한 미들웨어 함수를 호출하고  
싶다면 다음처럼 처리하면된다고 한다

```ts

const upload = multer().single('avatar')

app.post('/profile', (req, res) => upload(req, res, (err) => {
  if (err) {
    // error 발생시
    return
  }
  // 정상작동시
}))

```

이는 역시나 `express` 에서 사용하는 예시이다.
이를 `Nest` 스럽게 만들어야 한다.

