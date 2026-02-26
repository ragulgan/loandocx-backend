import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, Not } from 'typeorm';
import { LoanProcessingFees } from './processing.entity';
import { CreateProcessingFeesDto } from './dto/create.dto';
import { UpdateProcessingFeesDto } from './dto/update.dto';

@Injectable()
export class ProcessingFeesService {
  constructor(
    @InjectRepository(LoanProcessingFees) private loanProcessingRepo: Repository<LoanProcessingFees>,
  ) { }

  async create(dto: CreateProcessingFeesDto) {
    const user = this.loanProcessingRepo.create(dto);
    return await this.loanProcessingRepo.save(user);
  }

  async findAll(params: { limit?: number; skip?: number; from_loan_amount?: number }) {
    const { limit = 10, skip = 0, from_loan_amount } = params || {};

    const where: FindOptionsWhere<LoanProcessingFees> = {};

    if (from_loan_amount) {
      where.from_loan_amount = from_loan_amount;
    }

    const [loanProcessList, count] = await this.loanProcessingRepo.findAndCount({
      where,
      take: limit,
      skip,
      order: { id: 'DESC' },
    });

    return { loanProcessList, count };
  }

async findProcessingFeeByAmount(amount: number) {
  const result = await this.loanProcessingRepo
    .createQueryBuilder('fee')
    .select('fee.processing_fees')
    .where(
      'fee.from_loan_amount < :amount AND fee.to_loan_amount >= :amount',
      { amount },
    )
    .orderBy('fee.from_loan_amount', 'ASC')
    .limit(1)
    .getOne();

  return result?.processing_fees ?? 0;
}

  async findOne(id: number) {
    const user = await this.loanProcessingRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  async update(id: number, dto: UpdateProcessingFeesDto) {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return await this.loanProcessingRepo.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    return await this.loanProcessingRepo.remove(user);
  }
}