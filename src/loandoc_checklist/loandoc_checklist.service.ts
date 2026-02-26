import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, Not } from 'typeorm';
import { LoanDocCheckList } from './loandoc_checklist.entity';
import { CreateLoanDocCheckListDto } from './dto/create-loandoc.dto';
import { UpdateLoanDocCheckListDto } from './dto/update-loandoc.dto';

@Injectable()
export class LoanDocCheckListService {
  constructor(
    @InjectRepository(LoanDocCheckList) private loanDocCheckRepo: Repository<LoanDocCheckList>,
  ) { }

  async create(dto: CreateLoanDocCheckListDto) {
    const docCheckList = this.loanDocCheckRepo.create(dto);
    return await this.loanDocCheckRepo.save(docCheckList);
  }

  async findAll(params: any) {
    const { limit = 10, skip = 0, loan_id} = params || {};

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

    return { loanDocCheckList, count };
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