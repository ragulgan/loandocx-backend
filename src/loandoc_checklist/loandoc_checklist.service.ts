import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, Not } from 'typeorm';
import { LoanDocCheckList } from './entities/loandoc_checklist.entity';
import { CreateLoanDocCheckListDto } from './dto/create-loandoc.dto';
import { UpdateLoanDocCheckListDto } from './dto/update-loandoc.dto';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class LoanDocCheckListService {
  constructor(
    @InjectRepository(LoanDocCheckList) private loanDocCheckRepo: Repository<LoanDocCheckList>,
    private readonly redisService: RedisService,
  ) { }

  async create(dto: CreateLoanDocCheckListDto) {
    const docCheckList = this.loanDocCheckRepo.create(dto);
    return await this.loanDocCheckRepo.save(docCheckList);
  }

  async findAll(params: any) {
    const { limit = 10, skip = 0, loan_id} = params || {};
    //Create unique cache key
    const cacheKey = `loanDocsCheckList:${limit}:${skip}:${loan_id || 'all'}`;

    //Check Redis first
    const cachedData = await this.redisService.get(cacheKey);

    if (cachedData) {
      console.log("redis-server-cache-doc-checklist===>", loan_id)
      return JSON.parse(cachedData);
    }
    console.log("server-hit-doc-checklist===>", loan_id)

    const where: FindOptionsWhere<LoanDocCheckList> = {};

    if (loan_id) {
      where.loan_id = loan_id;
    }

    const [loanDocCheckList, count] = await this.loanDocCheckRepo.findAndCount({
      where,
      take: limit,
      skip,
      order: { id: 'DESC' },
      relations: ['loan'],
    });
    const result = { loanDocCheckList, count };
    await this.redisService.set(cacheKey, JSON.stringify(result));
    return result;
  }

  async findOne(id: number) {
    const loanDocCheck = await this.loanDocCheckRepo.findOne({ where: { id }, relations: ['loan'] });
    if (!loanDocCheck) throw new NotFoundException(`User with id ${id} not found`);
    return loanDocCheck;
  }

  async update(id: number, dto: UpdateLoanDocCheckListDto) {
    const loanDocCheck = await this.findOne(id);
    Object.assign(loanDocCheck, dto);
    return await this.loanDocCheckRepo.save(loanDocCheck);
  }

  async remove(id: number) {
    const loanDocCheck = await this.findOne(id);
    return await this.loanDocCheckRepo.remove(loanDocCheck);
  }
}