import { Controller, Get, Post, Body, Param, Patch, Delete, Res, BadRequestException, Query, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseService } from '../base/controller';
import { appConst } from '../libs/constant';
import * as _ from 'lodash';
import { AdminGuard, JwtAuthGuard, AgentGuard } from 'src/auth/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiCommonDeleteResponses, ApiCommonGetAllResponses, ApiCommonResponses } from 'src/Common/decorators/swagger-responses.decorator';
const { ERROR, SUCCESS } = appConst;

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly responseService: ResponseService,
  ) { }

  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @Post()
  @ApiCommonResponses({ successStatus: 201, successDescription: 'Created' })
  async create(@Body() dto: CreateUserDto, @Res() res: Response) {
    try {
      const createdUser = await this.usersService.create(dto);
      if (createdUser) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1005',
          data: {
            user_id: (createdUser as any).user_id,
            created_at: (createdUser as any).created_at,
          }
        }, '1005');
      }
      else {
        this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1002' }, '1002');
      }
    } catch (e) {
      console.log('test============>', e)
      if (e.response?.code) {
        return this.responseService.sendResponse(
          {},
          res,
          ERROR.CLIENT_ERROR.BAD_REQUEST,
          { code: e.response.code },
          e.response.code
        );
      }
      this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1002' }, '1002');
      // throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('change-password')
  @ApiCommonResponses({ successStatus: 201, successDescription: 'Created' })
  async updatePassword(@Body() dto: ChangePasswordDto, @Request() req: any, @Res() res: any) {
    try {
      const updateUserPassword = await this.usersService.updatePassword(dto.userId, dto.userType, dto);
      if (updateUserPassword) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1031',
          data: {
            user_id: (updateUserPassword as any).user_id,
            updated_at: (updateUserPassword as any).updated_at,
          }
        }, '1031');
      } else {
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
  @ApiQuery({ name: 'status', required: false, description: 'Return Based on status' })
  @ApiQuery({ name: 'user_name', required: false, description: 'user_name' })
  @ApiQuery({ name: 'mobile_number', required: false, description: 'mobile_number' })
  @ApiQuery({ name: 'email_id', required: false, description: 'email_id' })
  @Get()
  @ApiCommonGetAllResponses()
  async findAll(@Query() queryParams: { limit?: number; skip?: number }, @Res() res: any) {
    try {
      const getUser = await this.usersService.findAll(queryParams);
      if (!_.isEmpty(getUser)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: getUser.userList,
          count: getUser.count
        }, '1003');
      }
      else {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1004', data: [], count: getUser.userList.length }, '1004')
      }
    } catch {
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiCommonResponses()
  async findOne(@Param('id') id: string, @Request() req, @Res() res: any) {
    try {
      const getUserById = await this.usersService.findOne(id)
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
  @Get('admin/users-by-role/:type')
  @ApiCommonResponses()
  async findByRoleType(@Param('type') type: string, @Request() req, @Res() res: any) {
    try {
      const getUserByRole = await this.usersService.findByUserRoleType(type)
      if (!_.isEmpty(getUserByRole)) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1003',
          data: getUserByRole
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
  @ApiCommonResponses({ successStatus: 201, successDescription: 'Created' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Res() res: any) {
    try {
      const updateUser = await this.usersService.update(id, dto);
      if (updateUser) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, {
          code: '1006',
          data: {
            user_id: (updateUser as any).user_id,
            updated_at: (updateUser as any).updated_at,
          }
        }, '1006');
      } else {
        this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1002' }, '1002');
      }
    } catch (e) {
      console.log('test============>', e)
      if (e.response?.code) {
        return this.responseService.sendResponse(
          {},
          res,
          ERROR.CLIENT_ERROR.BAD_REQUEST,
          { code: e.response.code },
          e.response.code
        );
      }
      this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1002' }, '1002');
      // throw new BadRequestException();
    }
  }

  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiCommonDeleteResponses()
  async remove(@Param('id') id: string, @Res() res: any) {
    try {
      const deletedUser = await this.usersService.remove(id);
      if (deletedUser) {
        this.responseService.sendResponse({}, res, SUCCESS.CODE, { code: '1007', data: { user_id: (deletedUser as any).user_id } }, '1007');
      }
      else {
        this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1002' }, '1002');
      }
    } catch {
      throw new BadRequestException();
    }
  }
}
