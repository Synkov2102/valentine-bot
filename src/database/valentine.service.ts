import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Valentine } from './schemas/valentine.schema';

@Injectable()
export class ValentineService {
  constructor(
    @InjectModel('Valentine') private valentineModel: Model<Valentine>,
  ) {}

  async create(valentine: Valentine): Promise<Valentine> {
    const createdValentine = new this.valentineModel(valentine);
    return await createdValentine.save();
  }

  async findValentinesForUser(username: string): Promise<Valentine[]> {
    return await this.valentineModel.find({ to: username }).exec();
  }

  async findAll(): Promise<Valentine[]> {
    return await this.valentineModel.find().exec();
  }

  async findById(id: string): Promise<Valentine> {
    return await this.valentineModel.findById(id).exec();
  }

  async delete(id: string): Promise<Valentine> {
    return await this.valentineModel.findByIdAndDelete(id).exec();
  }
}
