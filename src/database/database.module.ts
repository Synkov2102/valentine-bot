import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ValentineSchema } from './schemas/valentine.schema';
import { ValentineService } from './valentine.service';
import { ImageSchema } from './schemas/image.schema';
import { ImageService } from './image.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI),
    MongooseModule.forFeature([{ name: 'Valentine', schema: ValentineSchema }]),
    MongooseModule.forFeature([{ name: 'Image', schema: ImageSchema }]),
  ],
  providers: [ValentineService, ImageService],
  exports: [ValentineService, ImageService],
})
export class DatabaseModule {}
