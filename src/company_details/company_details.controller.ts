import { Controller, Get, Post, Body, Param, Patch, Delete, Res, BadRequestException, Query, Request, UseGuards } from '@nestjs/common';
import { LoanCompanyDetailService } from './company_details.service';
import { CreateLoanCompanyDetailsDto } from './dto/create-details.dto';
import { UpdateLoanCompanyDetailsDto } from './dto/update-details.dto';
import { ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseService } from '../base/controller';
import { appConst, USER_TYPE } from '../libs/constant';
import * as _ from 'lodash';
import { JwtAuthGuard, RolesGuard } from 'src/auth/jwt-auth.guard';
import { ApiCommonResponses, ApiCommonGetAllResponses, ApiCommonDeleteResponses } from 'src/Common/decorators/swagger-responses.decorator';
import { Roles } from 'src/role/roles.decorator';
const { ERROR, SUCCESS } = appConst;

@ApiTags('loan-company-details')
@Controller('loan-company-details')
export class LoanCompanyDetailController {
  constructor(
    private readonly loanCompanyDetailService: LoanCompanyDetailService,
    private readonly responseService: ResponseService,
  ) { }

  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.ADMIN)
  @ApiBearerAuth()
  @Post()
  @ApiCommonResponses({ successStatus: 201, successDescription: 'Created' })
  async create(@Body() dto: CreateLoanCompanyDetailsDto, @Res() res: Response) {
    try {
      const createdLoanCompany = await this.loanCompanyDetailService.create(dto);
      if (createdLoanCompany) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1025',
          data: {
            id: (createdLoanCompany as any).id,
            created_at: (createdLoanCompany as any).created_at,
          }
        }, '1025');
      } else {
        this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1002' }, '1002');
      }
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.ADMIN)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'company_name', required: false, description: 'Return Based on company_name' })
  @ApiQuery({ name: 'bank_name', required: false, description: 'Return Based on bank_name' })
  @ApiQuery({ name: 'branch_name', required: false, description: 'Return Based on branch_name' })
  @ApiQuery({ name: 'email_id', required: false, description: 'Return Based on company_mail_id' })
  @Get()
  @ApiCommonGetAllResponses()
  async findAll(@Query() queryParams: { limit?: number; page?: number }, @Res() res: any) {
    try {
      const getLoanCompany = await this.loanCompanyDetailService.findAll(queryParams);
      if (!_.isEmpty(getLoanCompany)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: getLoanCompany.loanCompanyList,
          count: getLoanCompany.count
        }, '1003');
      }
      else {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1004', data: [], count: getLoanCompany.loanCompanyList.length }, '1004')
      }
    } catch {
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.ADMIN)
  @ApiBearerAuth()
  @Get(':id')
  @ApiCommonResponses()
  async findOne(@Param('id') id: number, @Request() req, @Res() res: any) {
    try {
      const getLoanCompanyById = await this.loanCompanyDetailService.findOne(id)
      if (!_.isEmpty(getLoanCompanyById)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: getLoanCompanyById
        }, '1003');
      } else {
        this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1004' }, '1004');
      }
    } catch {
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.ADMIN)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiCommonResponses({ successStatus: 201, successDescription: 'Created' })
  async update(@Param('id') id: number, @Body() dto: UpdateLoanCompanyDetailsDto, @Res() res: any) {
    try {
      const updateLoanCompany = await this.loanCompanyDetailService.update(id, dto);
      if (updateLoanCompany) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1026',
          data: {
            id: (updateLoanCompany as any).id,
            updated_at: (updateLoanCompany as any).updated_at,
          }
        }, '1026');
      } else {
        this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1002' }, '1002');
      }
    } catch (e) {
      console.log('test============>', e)
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.ADMIN)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiCommonDeleteResponses()
  async remove(@Param('id') id: number, @Res() res: any) {
    try {
      const deletedLoanCompany = await this.loanCompanyDetailService.remove(id);
      if (deletedLoanCompany) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1027', data: { id: (deletedLoanCompany as any).id } }, '1027');
      }
      else {
        this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1002' }, '1002');
      }
    } catch {
      throw new BadRequestException();
    }
  }
}