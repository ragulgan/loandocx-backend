import { Controller, Get, Post, Body, Param, Patch, Delete, Res, BadRequestException, Query, Request, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CustomerLoanDetailService } from './customer_loan.service';
import { CreateCustomerLoanDetailsDto } from './dto/create-csloan.dto';
import { UpdateCustomerLoanDetailsDto } from './dto/update-csloan.dto';
import { ApiTags, ApiQuery, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ResponseService } from '../base/controller';
import { appConst, USER_TYPE } from '../libs/constant';
import * as _ from 'lodash';
import { JwtAuthGuard, RolesGuard } from 'src/auth/jwt-auth.guard';
import { AdminApproveDto } from './dto/admin-approve.dto';
import { CivilApproveDto } from './dto/civile-approve.dto';
import { LegalTeamApproveDto } from './dto/legal-team-approve';
import { LegalHeadApproveDto } from './dto/legal-head-approve';
import { AdminPayoutSettleDto } from './dto/admin-payour.dto';
import { UploadDocDto } from './dto/agent-doc-upload.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from './s3.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApiCommonResponses, ApiCommonGetAllResponses } from 'src/Common/decorators/swagger-responses.decorator';
import { Roles } from 'src/role/roles.decorator';
const { ERROR, SUCCESS } = appConst;

@ApiTags('customer-loan-details')
@Controller('customer-loan-details')
export class CustomerLoanDetailController {
  constructor(
    private readonly customerLoanDetailsService: CustomerLoanDetailService,
    private readonly responseService: ResponseService,
    private readonly s3Service: S3Service,
  ) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.AGENT)
  @ApiBearerAuth()
  @Post('agent/loans/submit')
  @ApiCommonResponses({ successStatus: 201, successDescription: 'Created' })
  async create(@Body() dto: CreateCustomerLoanDetailsDto, @Res() res: Response) {
    try {
      const createdCustomerLoanDetail = await this.customerLoanDetailsService.create(dto);
      if (createdCustomerLoanDetail) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1032',
          data: {
            customer_id: (createdCustomerLoanDetail as any).customer_id,
            customer_name: (createdCustomerLoanDetail as any).customer_name,
            loan_name: (createdCustomerLoanDetail as any).loan_name,
            transaction_id: (createdCustomerLoanDetail as any).transaction_id,
            creation_date: (createdCustomerLoanDetail as any).creation_date,
          }
        }, '1032');
      }
      else {
        this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1002' }, '1002');
      }
    } catch (e) {
      console.log('test============>', e)
      // throw new BadRequestException();
      throw e;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.ADMIN)
  @ApiBearerAuth()
  @Post('admin/approve-transaction')
  @ApiCommonResponses({ successStatus: 201, successDescription: 'Created' })
  async adminApproveLoanApp(@Body() dto: AdminApproveDto, @Res() res: Response) {
    try {
      const adminLoanApprove = await this.customerLoanDetailsService.adminApprove(dto);
      if (adminLoanApprove) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1038',
          data: {
            status: (adminLoanApprove as any).success,
            transactionId: (adminLoanApprove as any).transactionId,
          }
        }, '1038');
      }
      else {
        this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1002' }, '1002');
      }
    } catch (e) {
      console.log('test============>', e)
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.CIVIL_USER)
  @ApiBearerAuth()
  @Post('civil/submit-report')
  @ApiCommonResponses({ successStatus: 201, successDescription: 'Created' })
  async CivilApproveLoanApp(@Body() dto: CivilApproveDto, @Res() res: Response) {
    try {
      const civilUserLoanApprove = await this.customerLoanDetailsService.CivilApproveLoanApp(dto);
      if (civilUserLoanApprove) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1038',
          data: {
            status: (civilUserLoanApprove as any).success,
            transactionId: (civilUserLoanApprove as any).transactionId,
          }
        }, '1038');
      }
      else {
        this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1002' }, '1002');
      }
    } catch (e) {
      console.log('test============>', e)
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.LEGAL_USER)
  @ApiBearerAuth()
  @Post('legal/submit-report')
  @ApiCommonResponses({ successStatus: 201, successDescription: 'Created' })
  async LegalTeamApproveLoanApp(@Body() dto: LegalTeamApproveDto, @Res() res: Response) {
    try {
      const legalUserLoanApprove = await this.customerLoanDetailsService.LegalTeamApproveLoanApp(dto);
      if (legalUserLoanApprove) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1038',
          data: {
            status: (legalUserLoanApprove as any).success,
            transactionId: (legalUserLoanApprove as any).transactionId,
          }
        }, '1038');
      }
      else {
        this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1002' }, '1002');
      }
    } catch (e) {
      console.log('test============>', e)
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.LEGAL_HEAD)
  @ApiBearerAuth()
  @Post('legal-head/submit-completion')
  @ApiCommonResponses({ successStatus: 201, successDescription: 'Created' })
  async LegalHeadApproveLoanApp(@Body() dto: LegalHeadApproveDto, @Res() res: Response) {
    try {
      const legalUserLoanApprove = await this.customerLoanDetailsService.LegalHeadApproveLoanApp(dto);
      if (legalUserLoanApprove) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1038',
          data: {
            status: (legalUserLoanApprove as any).success,
            transactionId: (legalUserLoanApprove as any).transactionId,
          }
        }, '1038');
      }
      else {
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
  @Post('admin/update-payout-status')
  @ApiCommonResponses({ successStatus: 201, successDescription: 'Created' })
  async adminPayoutSettle(@Body() dto: AdminPayoutSettleDto, @Res() res: Response) {
    try {
      const adminPayoutSettlement = await this.customerLoanDetailsService.adminPayout(dto);
      if (adminPayoutSettlement) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1039',
          data: {
            status: (adminPayoutSettlement as any).success,
            user_id: (adminPayoutSettlement as any).userId,
            affectedRows: (adminPayoutSettlement as any).affectedRows,
          }
        }, '1039');
      }
      else {
        this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1002' }, '1002');
      }
    } catch (e) {
      console.log('test============>', e)
      throw e;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.AGENT)
  @ApiBearerAuth()
  @Post('agent/upload-single-doc')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customerId: { type: 'number' },
        docName: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadDoc(
    @Body() dto: UploadDocDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.customerLoanDetailsService.uploadSingleDoc(dto, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.ADMIN)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get('admin/pending-approvals')
  @ApiCommonGetAllResponses()
  async findAll(@Query() queryParams: { limit?: number; page?: number }, @Res() res: any) {
    try {
      const getLoanCompany = await this.customerLoanDetailsService.findAll(queryParams);
      if (!_.isEmpty(getLoanCompany)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: getLoanCompany.loanPendingList,
          count: getLoanCompany.count
        }, '1003');
      }
      else {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1004', data: [], count: getLoanCompany.loanPendingList.length }, '1004')
      }
    } catch {
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.AGENT)
  @ApiBearerAuth()
  @Get('agent/loans/track/:query')
  @ApiCommonResponses()
  async trackLoan(@Param('query') query: string, @Query('type') type: 'txn' | 'mobile', @Res() res: any) {
    try {
      const trackingData = await this.customerLoanDetailsService.trackLoan(query, type);
      if (!_.isEmpty(trackingData)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE,{
            code: '1003',
            status: (trackingData as any).success,
            data: (trackingData as any).data,
          }, '1003');
      } else {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1004', data: null }, '1004');
      }
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.AGENT, USER_TYPE.CIVIL_USER, USER_TYPE.LEGAL_USER, USER_TYPE.LEGAL_HEAD)
  @ApiBearerAuth()
  @Get('earnings/balance/:userId/:userType')
  @ApiCommonResponses()
  async getBalanceLoan(@Param('userId') userId: string, @Param('userType') userType: 'AT' | 'LU' | 'LH' | 'CU', @Res() res: any) {
    try {
      const balanceCheckData = await this.customerLoanDetailsService.getBalance(userId, userType);
      if (!_.isEmpty(balanceCheckData)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE,{
            code: '1003',
            data: (balanceCheckData as any).data,
          }, '1003');
      } else {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1004', data: null }, '1004');
      }
    } catch (e) {
      console.log('test=======>', e)
      throw e;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.AGENT)
  @ApiBearerAuth()
  @Get('agent/fetch-customer-details')
  @ApiCommonResponses()
  async fetchCustomerDetails(@Query('query') query: string, @Query('type') type: 'mobile' | 'customer_id', @Res() res: any) {
    try {
      const getCustomerDetail = await this.customerLoanDetailsService.fetchCustomerDetails(query, type);
      if (!_.isEmpty(getCustomerDetail)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: {
            checklist: (getCustomerDetail as any).checklist,
            customer: (getCustomerDetail as any).customer,
            transaction: (getCustomerDetail as any).transaction,
            files: (getCustomerDetail as any).files,
          }
        }, '1003');
      }
      else {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1004', data: [] }, '1004')
      }
    } catch (e) {
      console.log('test============>', e)
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.CIVIL_USER)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get('civil/job-queue/:userId')
  @ApiCommonGetAllResponses()
  async findCivilUserJob(@Param('userId') userId: string, @Query() queryParams: { limit?: number; page?: number }, @Res() res: any) {
    try {
      const getCivilUserJob = await this.customerLoanDetailsService.findCivilUserJob(userId, queryParams);
      if (!_.isEmpty(getCivilUserJob)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: getCivilUserJob.CivilPendingList,
          count: getCivilUserJob.count
        }, '1003');
      }
      else {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1004', data: [], count: getCivilUserJob.CivilPendingList.length }, '1004')
      }
    } catch {
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.LEGAL_USER)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get('legal/job-queue/:userId')
  @ApiCommonGetAllResponses()
  async findLegalTeamUserJob(@Param('userId') userId: string, @Query() queryParams: { limit?: number; page?: number }, @Res() res: any) {
    try {
      const getLegalUserJob = await this.customerLoanDetailsService.findLegalUserJob(userId, queryParams);
      if (!_.isEmpty(getLegalUserJob)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: getLegalUserJob.LegalTeamJobList,
          count: getLegalUserJob.count
        }, '1003');
      }
      else {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1004', data: [], count: getLegalUserJob.LegalTeamJobList.length }, '1004')
      }
    } catch {
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.LEGAL_HEAD)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get('legal-head/job-queue/:userId')
  @ApiCommonGetAllResponses()
  async findLegalHeadUserJob(@Param('userId') userId: string, @Query() queryParams: { limit?: number; page?: number }, @Res() res: any) {
    try {
      const getLegalHeadJob = await this.customerLoanDetailsService.findLegalHeadJob(userId, queryParams);
      if (!_.isEmpty(getLegalHeadJob)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: getLegalHeadJob.LegalHeadJobList,
          count: getLegalHeadJob.count
        }, '1003');
      }
      else {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1004', data: [], count: getLegalHeadJob.LegalHeadJobList.length }, '1004')
      }
    } catch {
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.ADMIN)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'toDate', required: false, description: 'return based on toDate' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'return based on fromDate'})
  @ApiQuery({ name: 'userType', required: false, description: 'return based on user type AT | LU | LH | CU' })
  @Get('api/admin/payments')
  @ApiCommonGetAllResponses()
  async adminPayoutSettlement(@Query() queryParams: { limit?: number; page?: number, userType: string, fromDate: string, toDate: string }, @Res() res: any) {
    try {
      const getLoanCompany = await this.customerLoanDetailsService.adminPayoutSettle(queryParams);
      if (!_.isEmpty(getLoanCompany)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: getLoanCompany.paymentList,
          count: getLoanCompany.count
        }, '1003');
      }
      else {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1004', data: [], count: getLoanCompany.paymentList.length }, '1004')
      }
    } catch {
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.ADMIN)
  @ApiBearerAuth()
  @ApiQuery({ name: 'userType', required: false, description: 'Return based on user type AT | LU | LH | CU' })
  @ApiQuery({ name: 'userId', required: false, description: 'Return based on user id' })
  @Get('admin/validate-payout-user')
  @ApiCommonResponses()
  async adminValidateUser(@Query() queryParams: { userType: string; userId: number }, @Res() res: any) {
    try {
      const userValidate = await this.customerLoanDetailsService.adminPayoutValidateUser(queryParams);
      if (!_.isEmpty(userValidate)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: {
            status: (userValidate as any).success,
            user_name: (userValidate as any).userName,
          }
        }, '1003');
      }
      else {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1004', data: {} }, '1004')
      }
    } catch (e) {
      console.log('test============>', e)
      throw e;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.ADMIN)
  @ApiBearerAuth()
  @Get('admin/docs/allowed/:id')
  @ApiCommonResponses()
  async getFiles(@Param('id') id: string, @Res() res: any) {
    try {
      const getFiles = await this.s3Service.getFilesByFolderId(id);
      if (!_.isEmpty(getFiles)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: {
            customer: (getFiles as any).customer,
            files: (getFiles as any).files
          }
        }, '1003');
      }
      else {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1004', data: {} }, '1004')
      }
    }
    catch (e) {
      console.log('test============>', e)
      throw e;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.LEGAL_USER, USER_TYPE.CIVIL_USER, USER_TYPE.LEGAL_HEAD)
  @ApiBearerAuth()
  @Get('legal/civil/docs/allowed/:txnId/:userType')
  @ApiCommonResponses()
  async getAllowedDocs(@Param('txnId') txnId: string, @Param('userType') userType: string, @Res() res: any) {
    try {
      const getFiles = await this.customerLoanDetailsService.getAllowedDocs(txnId, userType);
      if (getFiles && getFiles.length > 0) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: {
            result: getFiles,
          }
        }, '1003');
      }
      else {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1004', data: {} }, '1004')
      }
    } catch (e) {
      console.log('test============>', e)
      throw e;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.ADMIN)
  @ApiBearerAuth()
  @Get('admin/dashboard')
  @ApiCommonResponses()
  async getDashboard(@Res() res: any) {
    try {
      const data = await this.customerLoanDetailsService.getDashboardStats();
      if (!_.isEmpty(data)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: {
            payouts: (data as any).payouts,
            pending: (data as any).pending
          }
        }, '1003');
      }
      else {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1004', data: {} }, '1004')
      }
    } catch (e) {
      console.log('test============>', e)
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.ADMIN)
  @ApiBearerAuth()
  @Get('admin/customer-lookup')
  @ApiCommonResponses()
  async adminFetchCustomerDetails(@Query('query') query: string, @Query('type') type: 'mobile' | 'customer_id', @Res() res: any) {
  try {
    const getCustomerDetail = await this.customerLoanDetailsService.adminCustomerDetails(query, type);
    if (getCustomerDetail?.customer === null || getCustomerDetail?.message) {
      return this.responseService.sendResponse({}, res, SUCCESS.CODE, {
        code: '1004',
        data: [],
        message: getCustomerDetail.message ?? 'Customer not found'
      }, '1004');
    }
    return this.responseService.sendResponse({}, res, SUCCESS.CODE, {
      code: '1003',
      data: {
        customer: getCustomerDetail,
        message: getCustomerDetail.message
      }
    }, '1003');
  } catch (e) {
    console.log('test============>', e);
    throw new BadRequestException();
  }
}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.ADMIN)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'userType', required: false, description: "Return based on user type AT | LU | LH | CU" })
  @Get('admin/user-registry')
  @ApiCommonGetAllResponses()
  async adminUserDetails(@Query() queryParams: { limit?: number; page?: number, userType: string }, @Res() res: any) {
    try {
      const getUserDetails = await this.customerLoanDetailsService.adminUserDetails(queryParams);
      if (!_.isEmpty(getUserDetails)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: getUserDetails.AdminUserList,
          count: getUserDetails.count
        }, '1003');
      }
      else {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1004', data: [], count: getUserDetails.AdminUserList.length }, '1004')
      }
    } catch(e) {
      console.log("test============>", e)
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_TYPE.ADMIN)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'userType', required: false, description: "Return based on user type LU | LH | CU" })
  @Get('admin/pending-trans-report')
  @ApiCommonGetAllResponses()
  async adminPendingTransReport(@Query() queryParams: { limit?: number; page?: number, userType: string }, @Res() res: any) {
    try {
      const getUserDetails = await this.customerLoanDetailsService.adminPendingTransReport(queryParams);
      if (!_.isEmpty(getUserDetails)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: getUserDetails.records,
          count: getUserDetails.count
        }, '1003');
      }
      else {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1004', data: [], count: getUserDetails.records.length }, '1004')
      }
    } catch(e) {
      console.log("test============>", e)
      throw new BadRequestException();
    }
  }

//Cron job for archive transaction
@Cron(CronExpression.EVERY_DAY_AT_4AM)
  async archiveTransactions() {
    try {
      console.log(`Cron Job Started: Archive Transactions Process Started`);
      const data = await this.customerLoanDetailsService.archiveCompletedTransactions();
      if (!_.isEmpty(data)) {
        console.log(data);
        console.log(`Archive Transactions Process Completed`);
      }
    } catch (e) {
      throw new BadRequestException();
    }
  }
}