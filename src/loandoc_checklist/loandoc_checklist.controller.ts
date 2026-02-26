import { Controller, Get, Post, Body, Param, Patch, Delete, Res, BadRequestException, Query, Request, UseGuards } from '@nestjs/common';
import { LoanDocCheckListService } from './loandoc_checklist.service';
import { CreateLoanDocCheckListDto } from './dto/create-loandoc.dto';
import { UpdateLoanDocCheckListDto } from './dto/update-loandoc.dto';
import { ApiTags, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseService } from '../base/controller';
import { appConst } from '../libs/constant';
import * as _ from 'lodash';
import { AdminGuard, JwtAuthGuard } from 'src/auth/jwt-auth.guard';
const { ERROR, SUCCESS } = appConst;

@ApiTags('loan-doc-checklist')
@Controller('loan-doc-checklist')
export class LoanDocCheckListController {
  constructor(
    private readonly loandocCheckListService: LoanDocCheckListService,
    private readonly responseService: ResponseService,
  ) { }

  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @Post()
  @ApiResponse({ status: 200, description: 'Ok.',  
    schema: {
    example: {
      code: 0,
      messageCode: 0,
      data: {},
      message: 'string',
    }
  }})
  @ApiResponse({ status: 201, description: 'Created.'})
  @ApiResponse({ status: 401, description: 'Unauthorized.'})
  @ApiResponse({ status: 403, description: 'Forbidden.'})
  @ApiResponse({ status: 404, description: 'Not Found.'})
  async create(@Body() dto: CreateLoanDocCheckListDto, @Res() res: Response) {
    try {
      const createdLoanDoc = await this.loandocCheckListService.create(dto);
      if (createdLoanDoc) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1022',
          data: {
            id: (createdLoanDoc as any).id,
            created_at: (createdLoanDoc as any).created_at,
          }
        }, '1022');
      }
      else {
        this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1002' }, '1002');
      }
    } catch (e) {
      console.log('test============>', e)
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'loan_id', required: false, description: 'Return Based on loan_id' })
  @Get()
  @ApiResponse({ status: 200, description: 'Ok.', 
    schema: {
    example: {
      code: 0,
      messageCode: 0,
      data: {},
      count: 0,
      message: 'string',
    }
  }})
  @ApiResponse({ status: 401, description: 'Unauthorized.'})
  @ApiResponse({ status: 403, description: 'Forbidden.'})
  @ApiResponse({ status: 404, description: 'Not Found.'})
  async findAll(@Query() queryParams: { limit?: number; skip?: number }, @Res() res: any) {
    try {
      const getLoanDoc = await this.loandocCheckListService.findAll(queryParams);
      if (!_.isEmpty(getLoanDoc)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: getLoanDoc.loanDocCheckList,
          count: getLoanDoc.count
        }, '1003');
      }
      else {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1004', data: [], count: getLoanDoc.loanDocCheckList.length }, '1004')
      }
    } catch {
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiResponse({ status: 200, description: 'Ok.', 
    schema: {
    example: {
      code: 0,
      messageCode: 0,
      data: {},
      message: 'string',
    }
  }})
  @ApiResponse({ status: 401, description: 'Unauthorized.'})
  @ApiResponse({ status: 403, description: 'Forbidden.'})
  @ApiResponse({ status: 404, description: 'Not Found.'})
  async findOne(@Param('id') id: number, @Request() req, @Res() res: any) {
    try {
      const getLoanDocById = await this.loandocCheckListService.findOne(id)
      if (!_.isEmpty(getLoanDocById)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: getLoanDocById
        }, '1003');
      } else {
        this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1004' }, '1004');
      }
    } catch {
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Ok.',  
    schema: {
    example: {
      code: 0,
      messageCode: 0,
      data: {},
      message: 'string',
    }
  }})
  @ApiResponse({ status: 201, description: 'Created.'})
  @ApiResponse({ status: 401, description: 'Unauthorized.'})
  @ApiResponse({ status: 403, description: 'Forbidden.'})
  @ApiResponse({ status: 404, description: 'Not Found.'})
  async update(@Param('id') id: number, @Body() dto: UpdateLoanDocCheckListDto, @Res() res: any) {
    try {
      const updateLoanDoc = await this.loandocCheckListService.update(id, dto);
      if (updateLoanDoc) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1023',
          data: {
            id: (updateLoanDoc as any).id,
            updated_at: (updateLoanDoc as any).updated_at,
          }
        }, '1023');
      } else {
        this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1002' }, '1002');
      }
    } catch (e) {
      console.log('test============>', e)
      throw new BadRequestException();
    }
  }

  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Ok.',  
  schema: {
  example: {
    code: 0,
    messageCode: 0,
    message: 'string',
  }
}})
@ApiResponse({ status: 401, description: 'Unauthorized.'})
@ApiResponse({ status: 403, description: 'Forbidden.'})
@ApiResponse({ status: 404, description: 'Not Found.'})
  async remove(@Param('id') id: number, @Res() res: any) {
    try {
      const deletedLoanDoc = await this.loandocCheckListService.remove(id);
      if (deletedLoanDoc) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1024', data: { id: (deletedLoanDoc as any).id } }, '1024');
      }
      else {
        this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1002' }, '1002');
      }
    } catch {
      throw new BadRequestException();
    }
  }
}