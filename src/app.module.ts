import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from '@nestjs-modules/mailer';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerMiddleware } from './config/logger';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ScreenModule } from './screen/screen.module';
import { LoanTypeModule } from './loanType/loantype.module';
import { LoanDocCheckListModule } from './loandoc_checklist/loandoc_checklist.module';
import { LoanCompanyModule } from './company_details/company_details.module';
import { ProcessingFeesModule } from './processing_fees/processing.module';
import { CustomerLoanDetailsModule } from './customer-loan/customer_loan.module';
import { TransactionModule } from './transaction/transaction.module';
import { AgentDayWiseBalanceModule } from './agent-daywise-balance/agent-daywise.module';
import { CivilDayWiseBalanceModule } from './civil-daywise-balance/civil-daywise.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false, //disable in production
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST_NAME,
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD,
        },
      },
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    ScreenModule,
    LoanTypeModule,
    LoanDocCheckListModule,
    LoanCompanyModule,
    ProcessingFeesModule,
    CustomerLoanDetailsModule,
    TransactionModule,
    AgentDayWiseBalanceModule,
    CivilDayWiseBalanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
