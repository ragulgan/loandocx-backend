import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { UserLoginDto } from './dto/login.dto';
import { ResponseService } from '../base/controller';
import { appConst } from '../libs/constant';
const { ERROR, SUCCESS } = appConst;

@ApiTags('Auth')
@Controller('login')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly responseService: ResponseService,
  ) { }

  @Post('user')
  @ApiBody({ type: UserLoginDto })
  @ApiResponse({ status: 200, description: 'Ok.',  
    schema: {
    example: {
      code: 0,
      messageCode: 0,
        data: {
          id: "string",
          userMobile: "string",
          email: "string",
          status: "string",
          token: "string",
        },
      message: 'string',
    }
  }})
  @ApiResponse({ status: 201, description: 'Created.'})
  @ApiResponse({ status: 401, description: 'Unauthorized.'})
  @ApiResponse({ status: 403, description: 'Forbidden.'})
  @ApiResponse({ status: 404, description: 'Not Found.'})
  async UserLogin(@Body() createUserDto: UserLoginDto, @Res() res: Response) {
    const result = await this.authService.userLogin(createUserDto);
    const screens = result && result.user.screens.map((screen: any) => ({
      id: screen.screen_id,
      screen_name: screen.screen_name,
      screen_url: screen.screen_url,
      screen_active: screen.screen_active,
    })) || [];
    if (result && result.user.user_active !== "N") {
      this.responseService.sendResponse({}, res, SUCCESS.CODE, {
        code: '1013',
        data: {
          user_id: result.user.user_id,
          user_mobile: result.user.mobile_number,
          user_type: result.user.user_type,
          email_id: result.user.email_id,
          status: result.user.user_active,
          user_name: result.user.user_name,
          screens: screens,
          token: result.token
        }
      }, '1013');
    }else if (result && result.user.user_active === "N") {
      this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1015' }, '1015');
    }
    else {
      this.responseService.sendResponse({}, res, ERROR.CLIENT_ERROR.BAD_REQUEST, { code: '1014' }, '1014');
    }
    return result;
  }
}