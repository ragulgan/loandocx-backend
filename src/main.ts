import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: new Logger() });
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  const swaggerBuilder = new DocumentBuilder()
    .setTitle('LoanDocx API')
    .setDescription('The LoanDocx API description')
    .setVersion('1.0')
    .addBearerAuth({
      name: 'Authorization',
      type: 'apiKey',
      in: 'header',
      description: 'JWT authorization of an API',
    });

  if (process.env.SWAGGER_BASEPATH) {
    swaggerBuilder.addServer(process.env.SWAGGER_BASEPATH);
  }

  const document = SwaggerModule.createDocument(app, swaggerBuilder.build());
  document.security = [{ bearerAuth: [] }];
  const loginEndpoint = document.paths['/auth/login'];
  if (loginEndpoint?.post) {
    loginEndpoint.post.security = [];
  }
  SwaggerModule.setup('/api-docs', app, document);

  const globalPrefix = process.env.BASE_PATH || 'api';
  app.setGlobalPrefix(globalPrefix);

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
  Logger.log(`API is running on http://localhost:${port}${globalPrefix}`);
}
bootstrap();
