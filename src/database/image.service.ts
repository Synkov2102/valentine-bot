import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Image, ImageDocument } from './schemas/image.schema';

@Injectable()
export class ImageService {
  constructor(
    @InjectModel(Image.name) private imageModel: Model<ImageDocument>,
  ) {}

  async findAll(): Promise<ImageDocument[]> {
    return await this.imageModel.find().exec();
  }

  async findById(id: string): Promise<ImageDocument> {
    return await this.imageModel.findById(id).exec();
  }
}
