import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiCommonResponsesLogin() {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Ok.',
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
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Created.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    ApiResponse({ status: 403, description: 'Forbidden.' }),
    ApiResponse({ status: 404, description: 'Not Found.' }),
  );
}

export function ApiCommonResponses(options?: {
  successStatus?: number;
  successDescription?: string;
}) {
  return applyDecorators(
    ApiResponse({
      status: options?.successStatus ?? 200,
      description: options?.successDescription ?? 'Ok',
      schema: {
        example: {
          code: 0,
          messageCode: 0,
          data: {},
          message: 'string',
        },
      },
    }),

    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    ApiResponse({ status: 404, description: 'Not Found' }),
  );
}

export function ApiCommonGetAllResponses() {
return applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Ok.',
      schema: {
        example: {
          code: 0,
          messageCode: 0,
          data: {},
          count: 0,
          message: 'string',
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Created.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    ApiResponse({ status: 403, description: 'Forbidden.' }),
    ApiResponse({ status: 404, description: 'Not Found.' }),
  );
}

export function ApiCommonDeleteResponses() {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Ok.',
      schema: {
        example: {
          code: 0,
          messageCode: 0,
          message: 'string',
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
    ApiResponse({ status: 403, description: 'Forbidden.' }),
    ApiResponse({ status: 404, description: 'Not Found.' }),
  );
}