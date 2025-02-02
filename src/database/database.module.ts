import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ValentineSchema } from './schemas/valentine.schema';
import { ValentineService } from './valentine.service';
import { ImageSchema } from './schemas/image.schema';
import { ImageService } from './image.service';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://root:!Z21022002z@87.249.44.63:27017/'),
    MongooseModule.forFeature([{ name: 'Valentine', schema: ValentineSchema }]),
    MongooseModule.forFeature([{ name: 'Image', schema: ImageSchema }]),
  ],
  providers: [ValentineService, ImageService],
  exports: [ValentineService, ImageService],
})
export class DatabaseModule {}
