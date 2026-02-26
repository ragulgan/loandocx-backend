import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { Screen } from './screen.entity';
import { CreateScreenDto } from './dto/create-screen.dto';
import { UpdateScreenDto } from './dto/update-screen.dto';

@Injectable()
export class ScreenService {
  constructor(
    @InjectRepository(Screen) 
    private screenRepo: Repository<Screen>,
  ) {}

  async create(dto: CreateScreenDto) {
    const screen = this.screenRepo.create(dto);
    return await this.screenRepo.save(screen);
  }


  async findAll(params: { limit?: number; skip?: number; status?: string }) {
    const { limit = 10, skip = 0, status } = params || {};

    const where: FindOptionsWhere<Screen> = {};

    if (status) {
      where.screen_active = status;
    }

    const [screenList, count] = await this.screenRepo.findAndCount({
      where,
      take: limit,
      skip,
      order: { screen_id: 'DESC' }
    });

    return { screenList, count };
  }

  async findOne(screen_id: number) {
    const screen = await this.screenRepo.findOne({ 
      where: { screen_id }
    });
    
    if (!screen) {
      throw new NotFoundException(`Screen with id ${screen_id} not found`);
    }
    
    return screen;
  }

  async update(screen_id: number, dto: UpdateScreenDto) {
    const screen = await this.screenRepo.findOne({ where: { screen_id } });
    if (!screen) {
      throw new NotFoundException(`Screen with id ${screen_id} not found`);
    }
    Object.assign(screen, dto);
    return await this.screenRepo.save(screen);
  }

  async remove(screen_id: number) {
    const screen = await this.screenRepo.findOne({
      where: { screen_id }
    });

    if (!screen) {
      throw new NotFoundException(`Screen with id ${screen_id} not found`);
    }

    return await this.screenRepo.remove(screen);
  }
}