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
    const valentines = await this.valentineModel.find({ to: username }).exec();
    await this.valentineModel
      .updateMany({ to: username }, { viewed: true })
      .exec();
    return valentines;
  }

  async findUnviewedValentinesForUser(username: string): Promise<Valentine[]> {
    const valentines = await this.valentineModel
      .find({ to: username, viewed: false })
      .exec();
    if (valentines.length > 0) {
      await this.valentineModel
        .updateMany({ to: username, viewed: false }, { viewed: true })
        .exec();
    }
    return valentines;
  }

  async findAll(): Promise<Valentine[]> {
    return await this.valentineModel.find().exec();
  }

  async findById(id: string): Promise<Valentine | null> {
    const valentine = await this.valentineModel.findById(id).exec();
    if (valentine && !valentine.viewed) {
      await this.valentineModel.findByIdAndUpdate(id, { viewed: true }).exec();
    }
    return valentine;
  }

  async delete(id: string): Promise<Valentine | null> {
    return await this.valentineModel.findByIdAndDelete(id).exec();
  }
}
