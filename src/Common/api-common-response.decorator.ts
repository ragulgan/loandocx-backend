import { applyDecorators } from '@nestjs/common';
import { ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export function ApiCommonResponse(options?: {
  successStatus?: number;
  successDescription?: string;
}) {
  return applyDecorators(
    ApiBearerAuth(),

    ApiResponse({
      status: options?.successStatus ?? 200,
      description: options?.successDescription ?? 'Ok',
    }),

    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    ApiResponse({ status: 404, description: 'Not Found' }),
  );
}
