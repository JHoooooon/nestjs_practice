import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

export const multerOption = {
  storage: diskStorage({
    // destination 으로 uploads 폴더를 정한다.
    destination: join(__dirname, '..', 'uploads'),
    // filename 을 지정한다
    filename: (req, file, cb) => {
      // 랜덤한 uuid 값과 file.originalname 에서 추출한 extname 값을
      // 합쳐서 내보낸다.
      cb(null, randomUUID() + extname(file.originalname));
    },
  }),
};
