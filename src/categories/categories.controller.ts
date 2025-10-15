import {
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CategoriesService } from './categories.service';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'categories');

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

function filenameBuilder(
  _: any,
  file: Express.Multer.File,
  cb: (err: any, filename: string) => void,
) {
  const id = randomUUID();
  cb(null, `${id}${extname(file.originalname)}`);
}

function imageFileFilter(
  _: any,
  file: Express.Multer.File,
  cb: (err: Error | null, accept: boolean) => void,
) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new BadRequestException('Only image files are allowed'), false);
  }
  cb(null, true);
}

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly cats: CategoriesService,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
  ) {}

  private getUserIdFromReq(req: any) {
    const auth = req.headers?.authorization as string | undefined;
    if (!auth?.startsWith('Bearer ')) throw new Error('Unauthorized');
    const token = auth.slice('Bearer '.length);
    const payload: any = this.jwt.verify(token, {
      secret: this.cfg.get<string>('JWT_ACCESS_SECRET')!,
    });
    return payload.sub as string;
  }

  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: async (_req, _file, cb) => {
          try {
            await ensureUploadDir();
            cb(null, UPLOAD_DIR);
          } catch (e) {
            cb(e as Error, '');
          }
        },
        filename: filenameBuilder,
      }),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const userId = this.getUserIdFromReq(req);

    const relPath = `uploads/categories/${file.filename}`;

    try {
      const cat = await this.cats.setImage(userId, id, relPath);
      return {
        id: cat.id,
        name: cat.name,
        imagePath: cat.imagePath,
        isDefault: cat.isDefault,
      };
    } catch (e) {
      try {
        await fs.unlink(join(process.cwd(), relPath));
      } catch (_) {}
      throw e;
    }
  }
}
