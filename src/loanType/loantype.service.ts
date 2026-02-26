import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, Not } from 'typeorm';
import { Loantype } from './entities/loantype.entity';
import { CreateLoantypeDto } from './dto/create-loantype.dto';
import { UpdateLoantypeDto } from './dto/update-loantype.dto';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class LoantypeService {
  constructor(
    @InjectRepository(Loantype) private loanTypeRepo: Repository<Loantype>,
    private readonly redisService: RedisService,
  ) { }

  async create(dto: CreateLoantypeDto) {
    const user = this.loanTypeRepo.create(dto);
    return await this.loanTypeRepo.save(user);
  }

  async findAll(params: { limit?: number; skip?: number; status?: string, loan_name?: string }) {
    const { limit = 10, skip = 0, status, loan_name } = params || {};

    //Create unique cache key
    const cacheKey = `loanTypes:${limit}:${skip}:${status || 'all'}:${loan_name || 'all'}`;

    //Check Redis first
    const cachedData = await this.redisService.get(cacheKey);

    if (cachedData) {
      console.log("redis-server-cache-loan-type===>")
      return JSON.parse(cachedData);
    }
    console.log("server-hit-loan-type===>")
    const where: FindOptionsWhere<Loantype> = {};

    if (status) {
      where.loan_active = status;
    }

    if (loan_name) {
      where.loan_name = loan_name;
    }

    const [loantypeList, count] = await this.loanTypeRepo.findAndCount({
      where,
      take: limit,
      skip,
      order: { loan_id: 'DESC' },
    });
    const result = { loantypeList, count };
    await this.redisService.set(cacheKey, JSON.stringify(result));
    return result;
  }

  async findOne(loan_id: number) {
    const user = await this.loanTypeRepo.findOne({ where: { loan_id } });
    if (!user) throw new NotFoundException(`User with id ${loan_id} not found`);
    return user;
  }

  async update(loan_id: number, dto: UpdateLoantypeDto) {
    const user = await this.findOne(loan_id);
    Object.assign(user, dto);
    return await this.loanTypeRepo.save(user);
  }

  async remove(loan_id: number) {
    const user = await this.findOne(loan_id);
    return await this.loanTypeRepo.remove(user);
  }
}