import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateCustomerLoanDetailsDto } from './dto/create-csloan.dto';
import { AdminApproveDto } from './dto/admin-approve.dto';
import { Transaction } from '../transaction/transaction.entity';
import { CustomerLoanDetails } from './entities/customer_loan.entity';
import { DaywiseAgentBalance } from 'src/agent-daywise-balance/entities/agent_balance.entity';
import { LoanProcessingFees } from 'src/processing_fees/processing.entity';
import { LoanDocCheckList } from 'src/loandoc_checklist/loandoc_checklist.entity';
import { Loantype } from 'src/loanType/loantype.entity';
import { DaywiseCivilBalance } from 'src/civil-daywise-balance/entities/civil_balance.entity';
import { CivilApproveDto } from './dto/civile-approve.dto';
import { LegalTeamApproveDto } from './dto/legal-team-approve';
import { LegalHeadApproveDto } from './dto/legal-head-approve';

@Injectable()
export class CustomerLoanDetailService {
  constructor(
    @InjectRepository(CustomerLoanDetails) private customerLoanDetailRepo: Repository<CustomerLoanDetails>,
    @InjectRepository(Transaction) private transactionRepo: Repository<Transaction>,
    @InjectRepository(DaywiseAgentBalance) private agentBalanceRepo: Repository<DaywiseAgentBalance>,
    @InjectRepository(LoanProcessingFees) private loanFeesRepo: Repository<LoanProcessingFees>,
    @InjectRepository(LoanDocCheckList) private readonly checklistRepo: Repository<LoanDocCheckList>,
    @InjectRepository(DaywiseCivilBalance) private civilBalanceRepo: Repository<DaywiseCivilBalance>,
    private readonly dataSource: DataSource,
  ) { }

  async create(dto: CreateCustomerLoanDetailsDto) {
    return await this.customerLoanDetailRepo.manager.transaction(
      async (manager) => {
        const customerLoan = manager.create(CustomerLoanDetails, {
          ...dto,
        });
        const savedCustomerLoan = await manager.save(customerLoan);
        const transaction = manager.create(Transaction, {
          loan_name: dto.loan_name,
          customer_id: savedCustomerLoan.customer_id,
          agent_id: dto.agent_id,
          trans_creation_date: dto.creation_date,
          transaction_state: 'P',
        });
        const savedTransaction = await manager.save(transaction);
        savedCustomerLoan.transaction_id = savedTransaction.transaction_id;
        await manager.save(savedCustomerLoan);
        return savedCustomerLoan;
      },
    );
  }

  // using repository query builder
  async findAll(params: any) {
    const { limit = 10, skip = 0 } = params || {};
    const loanApp_pending = this.customerLoanDetailRepo
      .createQueryBuilder('c')
      .innerJoin(
        Transaction,
        't',
        `
          t.customer_id = c.customer_id
          AND t.transaction_id = c.transaction_id
          AND t.transaction_state = :state
          `,
        { state: 'P' },
      )
      .select([
        'c.loan_name AS loan_name',
        'c.customer_id AS customer_id',
        'c.agent_id AS agent_id',
        'c.loan_amount AS loan_amount',
        'c.processing_fees AS processing_fees',
        't.transaction_id AS transaction_id',
        'c.amount_recived AS amount_recived',
        'c.customer_name AS customer_name',
        'c.mobile_number AS mobile_number',
      ])
      .orderBy('c.customer_id', 'ASC')
      .skip(skip)
      .take(limit);
    const data = await loanApp_pending.getRawMany();
    const count = await loanApp_pending.getCount();
    return {
      loanPendingList: data,
      count,
    };
  }

  async adminApprove(dto: AdminApproveDto) {
    return this.dataSource.transaction(async (manager) => {
      const {
        transactionId,
        adminUserId,
        legalUserId,
        civilUserId,
        legalHeadId,
        agentId,
        loanAmount,
      } = dto;

      const transaction = await manager.query(
        `
      SELECT transaction_id 
      FROM LoandocX_Transactions
      WHERE transaction_id = ?
      `,
        [transactionId],
      );

      if (!transaction.length) {
        throw new BadRequestException('Transaction not found');
      }

      await manager.query(
        `
      UPDATE LoandocX_Transactions
      SET transaction_state = 'A',
          Trans_state_modified_by = ?,
          Trans_state_modified_on = CURDATE(),
          Legal_team_user = ?,
          Legal_team_job_allocation_date = CURDATE(),
          Civil_team_user = ?,
          Civil_team_job_allocation_date = CURDATE(),
          Legal_head_user = ?
      WHERE transaction_id = ?
      `,
        [
          adminUserId,
          legalUserId,
          civilUserId,
          legalHeadId,
          transactionId,
        ],
      );

      if (loanAmount <= 0) {
        throw new BadRequestException('Invalid loan amount');
      }

      const feeRow = await manager.query(
        `
      SELECT AT_fees 
      FROM LoandocX_loan_processing_fees
      WHERE from_loan_amount < ?
      AND to_loan_amount >= ?
      LIMIT 1
      `,
        [loanAmount, loanAmount],
      );

      const atFees = feeRow[0]?.AT_fees ?? 0;

      const balanceCheck = await manager.query(
        `
      SELECT COUNT(1) as cnt
      FROM LoandocX_Daywise_Agent_balance
      WHERE agent_id = ?
      AND trans_aproved_date = CURDATE()
      `,
        [agentId],
      );

      if (balanceCheck[0].cnt > 0) {
        await manager.query(
          `
        UPDATE LoandocX_Daywise_Agent_balance
        SET account_balance = account_balance + ?
        WHERE agent_id = ?
        AND trans_aproved_date = CURDATE()
        `,
          [atFees, agentId],
        );
      } else {
        await manager.query(
          `
        INSERT INTO LoandocX_Daywise_Agent_balance
        (agent_id, trans_aproved_date, account_balance, payment_done)
        VALUES (?, CURDATE(), ?, 'N')
        `,
          [agentId, atFees],
        );
      }

      return {
        success: true,
        transactionId,
      };
    })
  };

  async CivilApproveLoanApp(dto: CivilApproveDto) {
    return this.dataSource.transaction(async (manager) => {
      const {
        transactionId,
        userId,
        loanAmount,
        courierName,
        courierTrackingId,
        courierDate,
      } = dto;

      const transaction = await manager.query(
        `
      SELECT transaction_id 
      FROM LoandocX_Transactions
      WHERE transaction_id = ?
      `,
        [transactionId],
      );

      if (!transaction.length) {
        throw new BadRequestException('Transaction not found');
      }

      await manager.query(
        `
      UPDATE LoandocX_Transactions
      SET civil_team_job_completion_date = CURDATE(),
          civil_send_courier_name = ?,
          civil_courier_tracking_id = ?,
          civil_courier_date = ?
      WHERE transaction_id = ?
      `,
        [
          courierName,
          courierTrackingId,
          courierDate,
          transactionId,
        ],
      );

      if (loanAmount <= 0) {
        throw new BadRequestException('Invalid loan amount');
      }

      const feeRow = await manager.query(
        `
      SELECT CU_fees 
      FROM LoandocX_loan_processing_fees
      WHERE from_loan_amount < ?
      AND to_loan_amount >= ?
      LIMIT 1
      `,
        [loanAmount, loanAmount],
      );

      const cuFees = feeRow[0]?.CU_fees ?? 0;

      const balanceCheck = await manager.query(
        `
      SELECT COUNT(1) as cnt
      FROM LoandocX_Daywise_Civil_user_balance
      WHERE civil_user_id = ?
      AND civil_completion_date = CURDATE()
      `,
        [userId],
      );

      if (Number(balanceCheck[0]?.cnt) > 0) {
        await manager.query(
          `
        UPDATE LoandocX_Daywise_Civil_user_balance
        SET account_balance = account_balance + ?
        WHERE civil_user_id = ?
        AND civil_completion_date = CURDATE()
        `,
          [cuFees, userId],
        );
      } else {
        await manager.query(
          `
        INSERT INTO LoandocX_Daywise_Civil_user_balance
        (civil_user_id, civil_completion_date, account_balance, payment_done)
        VALUES (?, CURDATE(), ?, 'N')
        ON DUPLICATE KEY UPDATE
        account_balance = account_balance + VALUES(account_balance)
        `,
          [userId, cuFees],
        );
      }

      return {
        success: true,
        transactionId,
      };
    })
  };

  async LegalTeamApproveLoanApp(dto: LegalTeamApproveDto) {
    return this.dataSource.transaction(async (manager) => {
      const {
        transactionId,
        evaluationReport,
      } = dto;

      const transaction = await manager.query(
        `
      SELECT transaction_id 
      FROM LoandocX_Transactions
      WHERE transaction_id = ?
      `,
        [transactionId],
      );

      if (!transaction.length) {
        throw new BadRequestException('Transaction not found');
      }

      await manager.query(
        `
      UPDATE LoandocX_Transactions
      SET legal_team_job_completion_date = CURDATE(),
          Legal_team_report = ?,
          legal_head_job_allocation_date = CURDATE()
      WHERE transaction_id = ?
      `,
        [
          evaluationReport,
          transactionId,
        ],
      );

      return {
        success: true,
        transactionId,
      };
    })
  };

  async LegalHeadApproveLoanApp(dto: LegalHeadApproveDto) {
    return this.dataSource.transaction(async (manager) => {
      const {
        transactionId,
        legalUserId,
        legalHeadId,
        legalUserCompDate,
        loanAmount,
        courierName,
        trackingId,
        sendDate,
      } = dto;

      const transaction = await manager.query(
        `
      SELECT transaction_id 
      FROM LoandocX_Transactions
      WHERE transaction_id = ?
      `,
        [transactionId],
      );

      if (!transaction.length) {
        throw new BadRequestException('Transaction not found');
      }

      await manager.query(
        `
      UPDATE LoandocX_Transactions
      SET legal_head_job_completion_date = ?,
          legal_send_courier_name = ?,
          legal_courier_tracking_id = ?,
          legal_courier_date = ?
      WHERE transaction_id = ?
      `,
        [
          sendDate,
          courierName,
          trackingId,
          sendDate,
          transactionId,
        ],
      );

      if (loanAmount <= 0) {
        throw new BadRequestException('Invalid loan amount');
      }

      const feeRow = await manager.query(
        `
      SELECT LU_fees, LH_fees
      FROM LoandocX_loan_processing_fees
      WHERE from_loan_amount < ?
      AND to_loan_amount >= ?
      LIMIT 1
      `,
        [loanAmount, loanAmount],
      );

      if (feeRow.length > 0) {
        const luFees = feeRow[0]?.LU_fees ?? 0;
        const lhFees = feeRow[0]?.LH_fees ?? 0;
        const compDateOnly = new Date(legalUserCompDate).toISOString().split('T')[0];
        // 1. Update/Insert Legal User Balance
        const lubalanceCheck = await manager.query(
          `
      SELECT COUNT(1) as cnt
      FROM LoandocX_Daywise_Legal_user_balance
      WHERE legal_user_id = ?
      AND legal_completion_date = ?
      `,
          [legalUserId, compDateOnly],
        );

        if (Number(lubalanceCheck[0]?.cnt) > 0) {
          await manager.query(
            `
        UPDATE LoandocX_Daywise_Legal_user_balance
        SET account_balance = account_balance + ?
        WHERE legal_user_id = ?
        AND legal_completion_date = ?
        `,
            [luFees, legalUserId, compDateOnly],
          );
        } else {
          await manager.query(
            `
        INSERT INTO LoandocX_Daywise_Legal_user_balance
        (legal_user_id, legal_completion_date, account_balance, payment_done)
        VALUES (?, ?, ?, 'N')
        ON DUPLICATE KEY UPDATE
        account_balance = account_balance + VALUES(account_balance)
        `,
            [legalUserId, compDateOnly, luFees],
          );
        }

        // 2. Update/Insert Legal Head Balance
        const lhbalanceCheck = await manager.query(
          `
      SELECT COUNT(1) as cnt
      FROM LoandocX_Daywise_Legal_head_balance
      WHERE legal_head_id = ?
      AND legal_completion_date = ?
      `,
          [legalHeadId, sendDate],
        );

        if (Number(lhbalanceCheck[0]?.cnt) > 0) {
          await manager.query(
            `
        UPDATE LoandocX_Daywise_Legal_head_balance
        SET account_balance = account_balance + ?
        WHERE legal_head_id = ?
        AND legal_completion_date = ?
        `,
            [lhFees, legalHeadId, sendDate],
          );
        } else {
          await manager.query(
            `
        INSERT INTO LoandocX_Daywise_Legal_head_balance
        (legal_head_id, legal_completion_date, account_balance, payment_done)
        VALUES (?, ?, ?, 'N')
        ON DUPLICATE KEY UPDATE
        account_balance = account_balance + VALUES(account_balance)
        `,
            [legalHeadId, sendDate, lhFees],
          );
        }
      }

      return {
        success: true,
        transactionId,
      };
    })
  };

  async trackLoan(query: string, type: 'txn' | 'mobile') {
    let transactionId: string | null = null;
    if (type === 'mobile') {
      const customer = await this.dataSource.query(
        `
      SELECT transaction_id
      FROM LoandocX_Customers_loan_details
      WHERE mobile_number = ?
      `,
        [query],
      );

      if (!customer || customer.length === 0) {
        return "Invalid mobile number";
      }

      transactionId = customer[0].transaction_id;
    }

    if (type === 'txn') {
      transactionId = query;
    }

    const transaction = await this.dataSource.query(
      `
    SELECT 
      t.transaction_id,
      t.transaction_state,
      t.legal_team_job_completion_date,
      t.civil_team_job_completion_date,
      t.legal_head_job_completion_date,
      c.customer_name,
      c.loan_name,
      t.trans_creation_date
    FROM LoandocX_Transactions t
    LEFT JOIN LoandocX_Customers_loan_details c
      ON t.transaction_id = c.transaction_id
    WHERE t.transaction_id = ?
    `,
      [transactionId],
    );

    if (!transaction || transaction.length === 0) {
      return "Invalid transaction id";
    }
    return { success: true, data: transaction[0] };
  }

  async getBalance(userId: string, userType: string) {
    let query = '';
    let params = [userId];

    switch (userType) {
      case 'AT':
        query = `
          SELECT COALESCE(SUM(account_balance), 0) AS balance
          FROM LoandocX_Daywise_Agent_balance
          WHERE agent_id = ? AND payment_done = 'N'
        `;
        break;

      case 'LU':
        query = `
          SELECT COALESCE(SUM(account_balance), 0) AS balance
          FROM LoandocX_Daywise_Legal_user_balance
          WHERE legal_user_id = ? AND payment_done = 'N'
        `;
        break;

      case 'LH':
        query = `
          SELECT COALESCE(SUM(account_balance), 0) AS balance
          FROM LoandocX_Daywise_Legal_head_balance
          WHERE legal_head_id = ? AND payment_done = 'N'
        `;
        break;

      case 'CU':
        query = `
          SELECT COALESCE(SUM(account_balance), 0) AS balance
          FROM LoandocX_Daywise_Civil_user_balance
          WHERE civil_user_id = ? AND payment_done = 'N'
        `;
        break;

      default:
        throw new BadRequestException('Invalid user type for earnings calculation');
    }

    const result = await this.dataSource.query(query, params);
    const balance = Number(result[0]?.balance || 0);
    return { data: { balance } };
  }

  async fetchCustomerDetails(query: string, type: 'mobile' | 'customer_id') {
    let customer: any = null;
    if (type === 'mobile') {
      const results = await this.dataSource.query(
        `
        SELECT 
          customer_id, 
          customer_name, 
          loan_name, 
          Document_Stored_path
        FROM LoandocX_Customers_loan_details
        WHERE mobile_number = ?
        `,
        [query],
      );

      customer = results[0];
    }
    else if (type === 'customer_id') {
      const results = await this.dataSource.query(
        `
        SELECT 
          customer_id, 
          customer_name, 
          loan_name, 
          Document_Stored_path
        FROM LoandocX_Customers_loan_details
        WHERE customer_id = ?
        `,
        [query],
      );

      customer = results[0];
    }
    else {
      throw new BadRequestException('Invalid search type');
    }

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const checklist = await this.dataSource.query(
      `
      SELECT 
        a.doc_name, 
        a.doc_description
      FROM LoandocX_loan_doc_checklist a
      INNER JOIN LoandocX_loan_types b 
        ON a.loan_id = b.loan_id
      WHERE b.loan_name = ?
      AND b.loan_active = 'Y'
      `,
      [customer.loan_name],
    );

    return { customer, checklist };
  }

  async findCivilUserJob(userId: string, queryParams: { limit?: number; skip?: number }) {
    const limit = Number(queryParams?.limit) || 10;
    const skip = Number(queryParams?.skip) || 0;

    const countResult = await this.dataSource.query(
      `
      SELECT COUNT(*) as total
      FROM LoandocX_Customers_loan_details c
      INNER JOIN LoandocX_Transactions t
        ON c.customer_id = t.customer_id
        AND c.transaction_id = t.transaction_id
      WHERE t.civil_team_user = ?
        AND t.civil_team_job_allocation_date IS NOT NULL
        AND t.civil_team_job_completion_date IS NULL
        AND t.transaction_state = 'A'
      `,
      [userId],
    );

    const totalCount = countResult[0]?.total || 0;
    const CivilPendingList = await this.dataSource.query(
      `
      SELECT 
        t.transaction_id,
        c.loan_name,
        c.customer_id,
        c.loan_amount,
        c.customer_name,
        c.mobile_number,
        c.Loan_bank_name,
        c.Loan_branch_name,
        c.Loan_branch_address1,
        c.Loan_branch_address2,
        c.Loan_branch_mailid
      FROM LoandocX_Customers_loan_details c
      INNER JOIN LoandocX_Transactions t
        ON c.customer_id = t.customer_id
        AND c.transaction_id = t.transaction_id
      WHERE t.civil_team_user = ?
        AND t.civil_team_job_allocation_date IS NOT NULL
        AND t.civil_team_job_completion_date IS NULL
        AND t.transaction_state = 'A'
      ORDER BY t.transaction_id DESC
      LIMIT ?
      OFFSET ?
      `,
      [userId, limit, skip],
    );

    return {
      CivilPendingList,
      count: totalCount,
    };
  }

  async findLegalUserJob(userId: string, queryParams: { limit?: number; skip?: number }) {
    const limit = Number(queryParams?.limit) || 10;
    const skip = Number(queryParams?.skip) || 0;

    const countResult = await this.dataSource.query(
      `
      SELECT COUNT(*) as total
      FROM LoandocX_Customers_loan_details c
      INNER JOIN LoandocX_Transactions t
        ON c.customer_id = t.customer_id
        AND c.transaction_id = t.transaction_id
      WHERE t.legal_team_user = ?
        AND t.legal_team_job_allocation_date IS NOT NULL
        AND t.legal_team_job_completion_date IS NULL
        AND t.transaction_state = 'A'
      `,
      [userId],
    );

    const totalCount = countResult[0]?.total || 0;
    const LegalTeamJobList = await this.dataSource.query(
      `
      SELECT 
        t.transaction_id,
        c.loan_name,
        c.customer_id,
        c.loan_amount,
        c.customer_name,
        c.mobile_number
      FROM LoandocX_Customers_loan_details c
      INNER JOIN LoandocX_Transactions t
        ON c.customer_id = t.customer_id
        AND c.transaction_id = t.transaction_id
      WHERE t.legal_team_user = ?
        AND t.legal_team_job_allocation_date IS NOT NULL
        AND t.legal_team_job_completion_date IS NULL
        AND t.transaction_state = 'A'
      ORDER BY t.transaction_id DESC
      LIMIT ?
      OFFSET ?
      `,
      [userId, limit, skip],
    );

    return {
      LegalTeamJobList,
      count: totalCount,
    };
  }

  async findLegalHeadJob(userId: string, queryParams: { limit?: number; skip?: number }) {
    const limit = Number(queryParams?.limit) || 10;
    const skip = Number(queryParams?.skip) || 0;

    const countResult = await this.dataSource.query(
      `
      SELECT COUNT(*) as total
      FROM LoandocX_Customers_loan_details c
      INNER JOIN LoandocX_Transactions t
        ON c.customer_id = t.customer_id
        AND c.transaction_id = t.transaction_id
      WHERE t.legal_head_user = ?
        AND t.legal_head_job_allocation_date IS NOT NULL
        AND t.legal_head_job_completion_date IS NULL
        AND t.transaction_state = 'A'
      `,
      [userId],
    );

    const totalCount = countResult[0]?.total || 0;
    const LegalHeadJobList = await this.dataSource.query(
      `
      SELECT 
        t.transaction_id,
        c.loan_name,
        c.customer_id,
        c.loan_amount,
        c.customer_name,
        c.mobile_number,
        c.loan_bank_name,
        c.Loan_branch_name,
        c.Loan_branch_address1,
        c.Loan_branch_address2,
        c.Loan_branch_mailid,
        t.legal_team_user,
        t.legal_team_job_completion_date,
        t.legal_team_report
      FROM LoandocX_Customers_loan_details c
      INNER JOIN LoandocX_Transactions t
        ON c.customer_id = t.customer_id
        AND c.transaction_id = t.transaction_id
      WHERE t.legal_head_user = ?
        AND t.legal_head_job_allocation_date IS NOT NULL
        AND t.legal_head_job_completion_date IS NULL
        AND t.transaction_state = 'A'
      ORDER BY t.transaction_id DESC
      LIMIT ?
      OFFSET ?
      `,
      [userId, limit, skip],
    );

    return {
      LegalHeadJobList,
      count: totalCount,
    };
  }
}