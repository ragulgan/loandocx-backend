import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, Not } from 'typeorm';
import { LoanCompanyDetails } from './company_details.entity';
import { CreateLoanCompanyDetailsDto } from './dto/create-details.dto';
import { UpdateLoanCompanyDetailsDto } from './dto/update-details.dto';

@Injectable()
export class LoanCompanyDetailService {
  constructor(
    @InjectRepository(LoanCompanyDetails) private loanCompanyRepo: Repository<LoanCompanyDetails>,
  ) { }

  async create(dto: CreateLoanCompanyDetailsDto) {
    const loanCompany = this.loanCompanyRepo.create(dto);
    return await this.loanCompanyRepo.save(loanCompany);
  }

    async findAll(params: any) {
        const { limit = 10, skip = 0, company_name, bank_name, branch_name, email_id } = params || {};

        let where: FindOptionsWhere<LoanCompanyDetails> | FindOptionsWhere<LoanCompanyDetails>[] = {};

        if (company_name || bank_name || branch_name || email_id) {
            const baseWhere = { ...where };
            const orConditions: FindOptionsWhere<LoanCompanyDetails>[] = [];

            if (company_name) {
                orConditions.push({
                    ...baseWhere,
                    company_name: Like(`%${company_name}%`),
                });
            }

            if (bank_name) {
                orConditions.push({
                    ...baseWhere,
                    bank_name: Like(`%${bank_name}%`),
                });
            }

            if (branch_name) {
                orConditions.push({
                    ...baseWhere,
                    branch_name: Like(`%${branch_name}%`),
                });
            }

            if (email_id) {
                orConditions.push({
                    ...baseWhere,
                    company_mail_id: Like(`%${email_id}%`),
                });
            }
            where = orConditions;
        }

        const [loanCompanyList, count] = await this.loanCompanyRepo.findAndCount({
            where,
            take: limit,
            skip,
            order: { id: 'DESC' }
        });

        return { loanCompanyList, count };
    }

  async findOne(id: number) {
    const loanCompany = await this.loanCompanyRepo.findOne({ where: { id } });
    if (!loanCompany) throw new NotFoundException(`User with id ${id} not found`);
    return loanCompany;
  }

  async update(id: number, dto: UpdateLoanCompanyDetailsDto) {
    const loanCompany = await this.findOne(id);
    Object.assign(loanCompany, dto);
    return await this.loanCompanyRepo.save(loanCompany);
  }

  async remove(id: number) {
    const loanCompanyDelete = await this.findOne(id);
    return await this.loanCompanyRepo.remove(loanCompanyDelete);
  }
}