import { Controller, Get, Post, Body, Param, Patch, Delete, Res, BadRequestException, Query, Request, UseGuards } from '@nestjs/common';
import { ProcessingFeesService } from './processing.service';
import { CreateProcessingFeesDto } from './dto/create.dto';
import { UpdateProcessingFeesDto } from './dto/update.dto';
import { ApiTags, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseService } from '../base/controller';
import { appConst } from '../libs/constant';
import * as _ from 'lodash';
import { AdminGuard, JwtAuthGuard } from 'src/auth/jwt-auth.guard';
const { ERROR, SUCCESS } = appConst;

@ApiTags('loan-processing-fees')
@Controller('loan-fees')
export class ProcessingFeesController {
  constructor(
    private readonly loanProcessingService: ProcessingFeesService,
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
    async create(@Body() dto: CreateProcessingFeesDto, @Res() res: Response) {
      try {
        const createdUser = await this.loanProcessingService.create(dto);
        if (createdUser) {
          this.responseService.sendResponse({}, res, SUCCESS.CODE, {
            code: '1028',
            data: {
              id: (createdUser as any).id,
              created_at: (createdUser as any).created_at,
            }
          }, '1028');
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
  @ApiQuery({ name: 'page', required: false, })
  @ApiQuery({ name: 'limit', required: false, })
  @ApiQuery({ name: 'from_loan_amount', required: false, description: 'Return Based on loan amount' })
  @Get()
  @ApiResponse({
    status: 200, description: 'Ok.',
    schema: {
      example: {
        code: 0,
        messageCode: 0,
        data: {},
        count: 0,
        message: 'string',
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  async findAll(@Query() queryParams: { limit?: number; skip?: number }, @Res() res: any) {
    try {
      const getUser = await this.loanProcessingService.findAll(queryParams);
      if (!_.isEmpty(getUser)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: getUser.loanProcessList,
          count: getUser.count
        }, '1003');
      }
      else {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1004', data: [], count: getUser.loanProcessList.length }, '1004')
      }
    } catch {
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'from_loan_amount', required: true, description: 'Loan amount' })
  @Get('processing-fee')
  async getProcessingFee(@Query('from_loan_amount') amount: number, @Res() res: any) {
    try {
      if (!amount) {
        throw new BadRequestException('from_loan_amount is required');
      }
      const processingFee =
        await this.loanProcessingService.findProcessingFeeByAmount(Number(amount));

      this.responseService.sendResponse({}, res, SUCCESS.CODE, {
        code: '1003',
        data: { processing_fees: processingFee },
      }, '1003');
    } catch(e) {
      console.log('processing_fees===>', e);
      throw new BadRequestException();
    }
  }


    @UseGuards(AdminGuard)
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
        const getUserById = await this.loanProcessingService.findOne(id)
        if (!_.isEmpty(getUserById)) {
          this.responseService.sendResponse({}, res, SUCCESS.CODE, {
            code: '1003',
            data: getUserById
          }, '1003');
        } else {
          this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1004' }, '1004');
        }
      } catch {
        throw new BadRequestException();
      }
    }

    @UseGuards(AdminGuard)
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
    async update(@Param('id') id: number, @Body() dto: UpdateProcessingFeesDto, @Res() res: any) {
      try {
        const updateUser = await this.loanProcessingService.update(id, dto);
        if (updateUser) {
          this.responseService.sendResponse({}, res, SUCCESS.CODE, {
            code: '1029',
            data: {
              id: (updateUser as any).id,
              updated_at: (updateUser as any).updated_at,
            }
          }, '1029');
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
        const deletedUser = await this.loanProcessingService.remove(id);
        if (deletedUser) {
          this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1030', data: { id: (deletedUser as any).id } }, '1030');
        }
        else {
          this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1002' }, '1002');
        }
      } catch {
        throw new BadRequestException();
      }
    }
}
