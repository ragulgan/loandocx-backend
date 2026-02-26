import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, Not } from 'typeorm';
import { Loantype } from './loantype.entity';
import { CreateLoantypeDto } from './dto/create-loantype.dto';
import { UpdateLoantypeDto } from './dto/update-loantype.dto';

@Injectable()
export class LoantypeService {
  constructor(
    @InjectRepository(Loantype) private loanTypeRepo: Repository<Loantype>,
  ) { }

  async create(dto: CreateLoantypeDto) {
    const user = this.loanTypeRepo.create(dto);
    return await this.loanTypeRepo.save(user);
  }

  async findAll(params: { limit?: number; skip?: number; status?: string, loan_name?: string }) {
    const { limit = 10, skip = 0, status, loan_name } = params || {};

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

    return { loantypeList, count };
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