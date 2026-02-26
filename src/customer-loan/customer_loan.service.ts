import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { CreateCustomerLoanDetailsDto } from './dto/create-csloan.dto';
import { AdminApproveDto } from './dto/admin-approve.dto';
import { Transaction, TransactionArchive } from '../transaction/entities/transaction.entity';
import { CustomerLoanDetails } from './entities/customer_loan.entity';
import { DaywiseAgentBalance } from 'src/agent-daywise-balance/entities/agent_balance.entity';
import { LoanProcessingFees } from 'src/processing_fees/entities/processing.entity';
import { LoanDocCheckList } from 'src/loandoc_checklist/entities/loandoc_checklist.entity';
import { Loantype } from 'src/loanType/entities/loantype.entity';
import { DaywiseCivilBalance } from 'src/civil-daywise-balance/entities/civil_balance.entity';
import { CivilApproveDto } from './dto/civile-approve.dto';
import { LegalTeamApproveDto } from './dto/legal-team-approve';
import { LegalHeadApproveDto } from './dto/legal-head-approve';
import { AdminPayoutSettleDto } from './dto/admin-payour.dto';
import { S3Service }  from './s3.service'
import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class CustomerLoanDetailService {
  private s3: S3Client;
  constructor(
    @InjectRepository(CustomerLoanDetails) private customerLoanDetailRepo: Repository<CustomerLoanDetails>,
    @InjectRepository(Transaction) private transactionRepo: Repository<Transaction>,
    @InjectRepository(TransactionArchive) private transactionArchiveRepo: Repository<TransactionArchive>,
    @InjectRepository(DaywiseAgentBalance) private agentBalanceRepo: Repository<DaywiseAgentBalance>,
    @InjectRepository(LoanProcessingFees) private loanFeesRepo: Repository<LoanProcessingFees>,
    @InjectRepository(LoanDocCheckList) private readonly checklistRepo: Repository<LoanDocCheckList>,
    @InjectRepository(DaywiseCivilBalance) private civilBalanceRepo: Repository<DaywiseCivilBalance>,
    private readonly dataSource: DataSource,
    private readonly s3Service: S3Service,
  ) {
    this.s3 = new S3Client({
          region: process.env.AWS_REGION,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
        });
   }

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

        const sendSMS = process.env.SMS_SEND;
        if (sendSMS === 'true') {
          await this.SentAssignJobMSGToUser(manager, savedCustomerLoan.transaction_id, 'ADMIN', '5', 'adminJobAssign', '1', 'AD');
        }
        return savedCustomerLoan;
      },
    );
  }

  async findAll(params: any) {
    const limit = Number(params.limit) || 10;
    const page = Number(params.page) || 1;

    const offset = (page - 1) * limit;

    const data = await this.dataSource.query(
      `
    SELECT 
      c.loan_name,
      c.customer_id,
      c.agent_id,
      c.loan_amount,
      c.processing_fees,
      t.transaction_id,
      c.amount_recived,
      c.customer_name,
      c.mobile_number
    FROM loandocx_customers_loan_details c
    INNER JOIN loandocx_transactions t
      ON t.customer_id = c.customer_id
      AND t.transaction_id = c.transaction_id
      AND t.transaction_state = ?
    ORDER BY c.customer_id ASC
    LIMIT ? OFFSET ?
    `,
      ['P', limit, offset],
    );

    const countResult = await this.dataSource.query(
      `
    SELECT COUNT(*) as total
    FROM loandocx_customers_loan_details c
    INNER JOIN loandocx_transactions t
      ON t.customer_id = c.customer_id
      AND t.transaction_id = c.transaction_id
      AND t.transaction_state = ?
    `,
      ['P'],
    );

    return {
      loanPendingList: data,
      count: countResult[0].total,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit),
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
      FROM loandocx_transactions
      WHERE transaction_id = ?
      `,
        [transactionId],
      );

      if (!transaction.length) {
        throw new BadRequestException('Transaction not found');
      }

      await manager.query(
        `
      UPDATE loandocx_transactions
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
      FROM loandocx_loan_processing_fees
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
      FROM loandocx_daywise_agent_balance
      WHERE agent_id = ?
      AND trans_aproved_date = CURDATE()
      `,
        [agentId],
      );

      if (balanceCheck[0].cnt > 0) {
        await manager.query(
          `
        UPDATE loandocx_daywise_agent_balance
        SET account_balance = account_balance + ?
        WHERE agent_id = ?
        AND trans_aproved_date = CURDATE()
        `,
          [atFees, agentId],
        );
      } else {
        await manager.query(
          `
        INSERT INTO loandocx_daywise_agent_balance
        (agent_id, trans_aproved_date, account_balance, payment_done)
        VALUES (?, CURDATE(), ?, 'N')
        `,
          [agentId, atFees],
        );
      }
      const sendSMS = process.env.SMS_SEND;
      if (sendSMS === 'true') {
        await this.SentApprovalMSGToCustomer(manager, transactionId, 'CUSTOMER', '1', 'adminApprove');
        await this.SentAssignJobMSGToUser(manager, transactionId, 'Legal User| Civil User', '6', 'legalJobAssign', legalUserId, 'LU');
        await this.SentAssignJobMSGToUser(manager, transactionId, 'Legal User| Civil User', '6', 'civilJobAssign', civilUserId, 'CU');
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
      FROM loandocx_transactions
      WHERE transaction_id = ?
      `,
        [transactionId],
      );

      if (!transaction.length) {
        throw new BadRequestException('Transaction not found');
      }

      await manager.query(
        `
      UPDATE loandocx_transactions
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
      FROM loandocx_loan_processing_fees
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
      FROM loandocx_daywise_civil_user_balance
      WHERE civil_user_id = ?
      AND civil_completion_date = CURDATE()
      `,
        [userId],
      );

      if (Number(balanceCheck[0]?.cnt) > 0) {
        await manager.query(
          `
        UPDATE loandocx_daywise_civil_user_balance
        SET account_balance = account_balance + ?
        WHERE civil_user_id = ?
        AND civil_completion_date = CURDATE()
        `,
          [cuFees, userId],
        );
      } else {
        await manager.query(
          `
        INSERT INTO loandocx_daywise_civil_user_balance
        (civil_user_id, civil_completion_date, account_balance, payment_done)
        VALUES (?, CURDATE(), ?, 'N')
        ON DUPLICATE KEY UPDATE
        account_balance = account_balance + VALUES(account_balance)
        `,
          [userId, cuFees],
        );
      }
      const sendSMS = process.env.SMS_SEND;
      if (sendSMS === 'true') {
        await this.SentApprovalMSGToCustomer(manager, transactionId, 'CUSTOMER', '2', 'civilApprove');
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
      SELECT transaction_id, legal_head_user
      FROM loandocx_transactions
      WHERE transaction_id = ?
      `,
        [transactionId],
      );

      if (!transaction.length) {
        throw new BadRequestException('Transaction not found');
      }

      await manager.query(
        `
      UPDATE loandocx_transactions
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
      const sendSMS = process.env.SMS_SEND;
      if (sendSMS === 'true') {
        await this.SentApprovalMSGToCustomer(manager, transactionId, 'CUSTOMER', '3', 'legalApprove');
        await this.SentAssignJobMSGToUser(manager, transactionId, 'Legal Head', '7', 'legalHeadJobAssign', transaction[0].legal_head_user, 'LH');
      }
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
      FROM loandocx_transactions
      WHERE transaction_id = ?
      `,
        [transactionId],
      );

      if (!transaction.length) {
        throw new BadRequestException('Transaction not found');
      }

      await manager.query(
        `
      UPDATE loandocx_transactions
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
      FROM loandocx_loan_processing_fees
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
      FROM loandocx_daywise_legal_user_balance
      WHERE legal_user_id = ?
      AND legal_completion_date = ?
      `,
          [legalUserId, compDateOnly],
        );

        if (Number(lubalanceCheck[0]?.cnt) > 0) {
          await manager.query(
            `
        UPDATE loandocx_daywise_legal_user_balance
        SET account_balance = account_balance + ?
        WHERE legal_user_id = ?
        AND legal_completion_date = ?
        `,
            [luFees, legalUserId, compDateOnly],
          );
        } else {
          await manager.query(
            `
        INSERT INTO loandocx_daywise_legal_user_balance
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
      FROM loandocx_daywise_legal_head_balance
      WHERE legal_head_id = ?
      AND legal_completion_date = ?
      `,
          [legalHeadId, sendDate],
        );

        if (Number(lhbalanceCheck[0]?.cnt) > 0) {
          await manager.query(
            `
        UPDATE loandocx_daywise_legal_head_balance
        SET account_balance = account_balance + ?
        WHERE legal_head_id = ?
        AND legal_completion_date = ?
        `,
            [lhFees, legalHeadId, sendDate],
          );
        } else {
          await manager.query(
            `
        INSERT INTO loandocx_daywise_legal_head_balance
        (legal_head_id, legal_completion_date, account_balance, payment_done)
        VALUES (?, ?, ?, 'N')
        ON DUPLICATE KEY UPDATE
        account_balance = account_balance + VALUES(account_balance)
        `,
            [legalHeadId, sendDate, lhFees],
          );
        }
      }
      const sendSMS = process.env.SMS_SEND;
      if (sendSMS === 'true') {
        await this.SentApprovalMSGToCustomer(manager, transactionId, 'CUSTOMER', '4', 'legalHeadApprove');
      }
      return {
        success: true,
        transactionId,
      };
    })
  };

  async adminPayout(dto: AdminPayoutSettleDto) {
    return this.dataSource.transaction(async (manager) => {
      const {
        userType,
        userId,
        fromDate,
        toDate,
        paymentOn,
        paymentTranId,
        adminUserId
      } = dto;

      if (!userType || !userId || !fromDate || !toDate || !paymentOn || !paymentTranId || !adminUserId) {
        throw new BadRequestException('Missing required fields');
      }

      let tableName = '';
      let userColumn = '';
      let dateColumn = '';

      switch (userType) {
        case 'AT':
          tableName = 'loandocx_daywise_agent_balance';
          userColumn = 'agent_id';
          dateColumn = 'trans_aproved_date';
          break;

        case 'LU':
          tableName = 'loandocx_daywise_legal_user_balance';
          userColumn = 'legal_user_id';
          dateColumn = 'legal_completion_date';
          break;

        case 'LH':
          tableName = 'loandocx_daywise_legal_head_balance';
          userColumn = 'legal_head_id';
          dateColumn = 'legal_completion_date';
          break;

        case 'CU':
          tableName = 'loandocx_daywise_civil_user_balance';
          userColumn = 'civil_user_id';
          dateColumn = 'civil_completion_date';
          break;

        default:
          throw new BadRequestException('Invalid User Type');
      }

      const updateQuery = `
      UPDATE ${tableName}
      SET payment_done = 'Y',
          payment_tran_id = ?,
          payment_on = ?,
          Payment_done_by = ?
      WHERE ${userColumn} = ?
        AND ${dateColumn} >= ?
        AND ${dateColumn} <= ?
        AND payment_done = 'N'
    `;

      const result: any = await manager.query(updateQuery, [
        paymentTranId,
        paymentOn,
        adminUserId,
        userId,
        fromDate,
        toDate,
      ]);

      const affectedRows =
        result?.affectedRows ?? result?.[0]?.affectedRows ?? 0;

      if (affectedRows === 0) {
        throw new BadRequestException(
          'No pending payout records found for given date range',
        );
      }

      return {
        success: true,
        userId,
        affectedRows,
      };
    })
  }

  async uploadSingleDoc(
    dto: { customerId: number; docName: string },
    file: Express.Multer.File,
  ) {
    const { customerId, docName } = dto;

    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    // Check customer exists
    const cust = await this.dataSource.query(
      `SELECT Document_Stored_path, customer_name, loan_name, transaction_id
     FROM loandocx_customers_loan_details
     WHERE customer_id = ?`,
      [customerId],
    );

    if (!cust.length) {
      throw new NotFoundException('Customer not found');
    }

    const prefix = `uploads/${customerId}/`;

    const existingFiles = await this.s3Service.listFiles(prefix);

    const sanitizedPrefix = docName
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();

    let maxPage = 0;

    existingFiles.forEach((fileObj: any) => {
      const fileName = fileObj.Key.split('/').pop();

      if (
        fileName.startsWith(sanitizedPrefix) &&
        fileName.endsWith('.pdf')
      ) {
        const match = fileName.match(/_page(\d+)\.pdf$/);

        if (match) {
          const num = parseInt(match[1]);
          if (num > maxPage) maxPage = num;
        } else if (fileName === `${sanitizedPrefix}.pdf`) {
          if (maxPage === 0) maxPage = 1;
        }
      }
    });

    const nextPage = maxPage + 1;
    const newFileName = `${sanitizedPrefix}_page${nextPage}.pdf`;

    const key = `${prefix}${newFileName}`;

    // Directly use multer buffer
    await this.s3Service.uploadFile(key, file.buffer);

    await this.dataSource.query(
      `UPDATE loandocx_customers_loan_details
    SET Document_Stored_path = ?
    WHERE customer_id = ?
    AND (Document_Stored_path IS NULL OR Document_Stored_path = '')`,
      [prefix, customerId],
    );

    return {
      success: true,
      fileName: newFileName,
      s3Path: key,
      customer: {
        customer_name: cust[0].customer_name,
        loan_name: cust[0].loan_name,
        transaction_id: cust[0].transaction_id,
      },
    };
  }

  async getAllowedDocs(txnId: string, userType: string) {
    const txn = await this.dataSource.query(
      `SELECT loan_name, customer_id
     FROM loandocx_transactions
     WHERE transaction_id = ?`,
      [txnId],
    );

    if (!txn || txn.length === 0) {
      throw new NotFoundException('Transaction not found');
    }

    const { loan_name, customer_id } = txn[0];

    let requiredColumn: string;

    switch (userType) {
      case 'CU':
        requiredColumn = 'dc.doc_required_for_civil';
        break;

      case 'LU':
      case 'LH':
        requiredColumn = 'dc.doc_required_for_legal';
        break;

      default:
        throw new BadRequestException('Invalid user type');
    }

    const allowedDocs = await this.dataSource.query(
      `
    SELECT dc.doc_name, dc.doc_description
    FROM loandocx_loan_doc_checklist dc
    INNER JOIN loandocx_loan_types lt
      ON lt.loan_id = dc.loan_id
    WHERE lt.loan_name = ?
    AND lt.loan_active = 'Y'
    AND ${requiredColumn} = 'Y'
    `,
      [loan_name],
    );

    const prefix = `uploads/${customer_id}/`;

    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: prefix,
    });

    const response = await this.s3.send(listCommand);
    const filesInS3 = response.Contents || [];

    const s3Map = new Map<string, any>();

    for (const file of filesInS3) {
      if (!file.Key) continue;
      s3Map.set(file.Key.toLowerCase(), file);
    }

    const result: any = [];

    for (const doc of allowedDocs) {
      const sanitized = doc.doc_name
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();

      /**
       * matched or latest first file only get in s3 bucket code:
      */
      // const matchedFile = [...s3Map.keys()].find((key) =>
      //   key.includes(sanitized),
      // );

      // let fileUrl: any = null;

      // if (matchedFile) {
      //   const getCommand = new GetObjectCommand({
      //     Bucket: process.env.AWS_S3_BUCKET,
      //     Key: matchedFile,
      //   });

      //   fileUrl = await getSignedUrl(this.s3, getCommand, {
      //     expiresIn: 3600,
      //   });
      // }

      const matchedFile = filesInS3.filter((file) => {
        if (!file.Key) return false;
        return file.Key.toLowerCase().includes(sanitized);
      });

      const fileUrls = await Promise.all(
        matchedFile.map(async (file) => {
          const getCommand = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: file.Key!,
          });

          const signedUrl = await getSignedUrl(this.s3, getCommand, {
            expiresIn: 3600,
          });

          return {
            fileUrl: signedUrl,
          };
        }),
      );

      result.push({
        doc_name: doc.doc_name,
        doc_description: doc.doc_description,
        uploaded: !!matchedFile,
        // fileUrl,
        fileUrls: fileUrls,
      });
    }
    return result;
  }

  async trackLoan(query: string, type: 'txn' | 'mobile') {
    let transactionId: string | null = null;
    if (type === 'mobile') {
      const customer = await this.dataSource.query(
        `
      SELECT transaction_id
      FROM loandocx_customers_loan_details
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
    FROM loandocx_transactions t
    LEFT JOIN loandocx_customers_loan_details c
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
          FROM loandocx_daywise_agent_balance
          WHERE agent_id = ? AND payment_done = 'N'
        `;
        break;

      case 'LU':
        query = `
          SELECT COALESCE(SUM(account_balance), 0) AS balance
          FROM loandocx_daywise_legal_user_balance
          WHERE legal_user_id = ? AND payment_done = 'N'
        `;
        break;

      case 'LH':
        query = `
          SELECT COALESCE(SUM(account_balance), 0) AS balance
          FROM loandocx_daywise_legal_head_balance
          WHERE legal_head_id = ? AND payment_done = 'N'
        `;
        break;

      case 'CU':
        query = `
          SELECT COALESCE(SUM(account_balance), 0) AS balance
          FROM loandocx_daywise_civil_user_balance
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
    let transaction: any = null;
    if (type === 'mobile') {
      const results = await this.dataSource.query(
        `
        SELECT 
          customer_id, 
          customer_name, 
          loan_name, 
          Document_Stored_path,
          transaction_id
        FROM loandocx_customers_loan_details
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
          Document_Stored_path,
          transaction_id
        FROM loandocx_customers_loan_details
        WHERE customer_id = ?
        `,
        [query],
      );

      customer = results[0];
    }
    else {
      // throw new BadRequestException('Invalid search type');
      return {
        customer: null,
        checklist: [],
        files: [],
        message: 'Invalid search type'
      }
    }

    if (!customer) {
      // throw new NotFoundException('Customer not found');
      return {
        customer: null,
        checklist: [],
        files: [],
        message: 'Customer not found'
      };
    }

    const transactionDetails = await this.dataSource.query(
      `
    SELECT 
      transaction_id,
      legal_team_job_completion_date,
      civil_team_job_completion_date,
      legal_head_job_completion_date
    FROM loandocx_transactions WHERE transaction_id = ?
    `,
      [customer.transaction_id],
    );
    if (transactionDetails.length > 0) {
      transaction = transactionDetails[0];
    }

    const checklist = await this.dataSource.query(
      `
      SELECT 
        a.doc_name, 
        a.doc_description
      FROM loandocx_loan_doc_checklist a
      INNER JOIN loandocx_loan_types b 
        ON a.loan_id = b.loan_id
      WHERE b.loan_name = ?
      AND b.loan_active = 'Y'
      `,
      [customer.loan_name],
    );

    let folderId = customer?.customer_id;

    const prefix = `uploads/${folderId}/`;

    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: prefix,
    });

    const response = await this.s3.send(listCommand);
    let result: any = [];

    if (!response.Contents || response.Contents.length === 0) {
         result = [];
      }

    /**
   * latest upload file only get in s3 bucket code:
   */
    // const fileMap = new Map<string, any>();

    // if(response.Contents && response.Contents.length > 0){
    //   for (const item of response.Contents) {
    //   if (!item.Key || item.Key === prefix) continue;

    //   const fileName = item.Key.replace(prefix, '');

    //   //  Extract base name before first "_"
    //   // const baseName = fileName.split('_')[0];

    //   const nameWithoutExt = fileName.replace('.pdf', '');
    //   const baseName = nameWithoutExt.replace(/_page\d+$/, '');

    //   if (!fileMap.has(baseName)) {
    //     fileMap.set(baseName, item);
    //   } else {
    //     const existing = fileMap.get(baseName);

    //     const existingDate = existing.LastModified
    //       ? existing.LastModified.getTime()
    //       : 0;

    //     const currentDate = item.LastModified
    //       ? item.LastModified.getTime()
    //       : 0;

    //     if (currentDate > existingDate) {
    //       fileMap.set(baseName, item);
    //     }
    //   }
    // }
    // }

    // for (const [baseName, item] of fileMap.entries()) {
    //   const getCommand = new GetObjectCommand({
    //     Bucket: process.env.AWS_S3_BUCKET,
    //     Key: item.Key,
    //   });

    //   const signedUrl = await getSignedUrl(this.s3, getCommand, {
    //     expiresIn: 3600,
    //   });

    //   result.push({
    //     docName: baseName,
    //     fileName: item.Key.replace(prefix, ''),
    //     key: item.Key,
    //     lastModified: item.LastModified,
    //     size: item.Size,
    //     url: signedUrl
    //   });
    // }

    if (response.Contents && response.Contents.length > 0) {
      for (const item of response.Contents) {
        if (!item.Key || item.Key === prefix) continue;

        const fileName = item.Key.replace(prefix, '');

        //  Extract base name before first "_"
        // const baseName = fileName.split('_')[0];

        const nameWithoutExt = fileName.replace('.pdf', '');
        const baseName = nameWithoutExt.replace(/_page\d+$/, '');

        const getCommand = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: item.Key,
        });

        const signedUrl = await getSignedUrl(this.s3, getCommand, {
          expiresIn: 3600,
        });

        result.push({
          docName: baseName,
          fileName: item.Key.replace(prefix, ''),
          key: item.Key,
          lastModified: item.LastModified,
          size: item.Size,
          url: signedUrl
        });
      }
    }

    return { customer, checklist, transaction, files: result };
  }

  async findCivilUserJob(userId: string, queryParams: { limit?: number; page?: number }) {
    const limit = Number(queryParams.limit) || 10;
    const page = Number(queryParams.page) || 1;
    const offset = (page - 1) * limit;

    const countResult = await this.dataSource.query(
      `
      SELECT COUNT(*) as total
      FROM loandocx_customers_loan_details c
      INNER JOIN loandocx_transactions t
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
        c.Loan_branch_mailid,
        t.civil_team_job_allocation_date
      FROM loandocx_customers_loan_details c
      INNER JOIN loandocx_transactions t
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
      [userId, limit, offset],
    );

    return {
      CivilPendingList,
      count: totalCount,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit),
    };
  }

  async findLegalUserJob(userId: string, queryParams: { limit?: number; page?: number }) {
    const limit = Number(queryParams.limit) || 10;
    const page = Number(queryParams.page) || 1;
    const offset = (page - 1) * limit;

    const countResult = await this.dataSource.query(
      `
      SELECT COUNT(*) as total
      FROM loandocx_customers_loan_details c
      INNER JOIN loandocx_transactions t
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
      FROM loandocx_customers_loan_details c
      INNER JOIN loandocx_transactions t
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
      [userId, limit, offset],
    );

    return {
      LegalTeamJobList,
      count: totalCount,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit),
    };
  }

  async findLegalHeadJob(userId: string, queryParams: { limit?: number; page?: number }) {
    const limit = Number(queryParams.limit) || 10;
    const page = Number(queryParams.page) || 1;
    const offset = (page - 1) * limit;

    const countResult = await this.dataSource.query(
      `
      SELECT COUNT(*) as total
      FROM loandocx_customers_loan_details c
      INNER JOIN loandocx_transactions t
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
      FROM loandocx_customers_loan_details c
      INNER JOIN loandocx_transactions t
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
      [userId, limit, offset],
    );

    return {
      LegalHeadJobList,
      count: totalCount,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit),
    };
  }

  async adminPayoutSettle(queryParams: {
    userType: string;
    fromDate: string;
    toDate: string;
    limit?: number;
    page?: number;
  }) {
    const { userType, fromDate, toDate } = queryParams;

    const limit = Number(queryParams.limit) || 10;
    const page = Number(queryParams.page) || 1;
    const offset = (page - 1) * limit;

    let tableName = '';
    let joinCondition = '';
    let dateColumn = '';

    switch (userType) {
      case 'AT':
        tableName = 'loandocx_daywise_agent_balance';
        joinCondition = 'a.agent_id = b.user_id';
        dateColumn = 'a.trans_aproved_date';
        break;

      case 'LU':
        tableName = 'loandocx_daywise_legal_user_balance';
        joinCondition = 'a.legal_user_id = b.user_id';
        dateColumn = 'a.legal_completion_date';
        break;

      case 'CU':
        tableName = 'loandocx_daywise_civil_user_balance';
        joinCondition = 'a.civil_user_id = b.user_id';
        dateColumn = 'a.civil_completion_date';
        break;

      case 'LH':
        tableName = 'loandocx_daywise_legal_head_balance';
        joinCondition = 'a.legal_head_id = b.user_id';
        dateColumn = 'a.legal_completion_date';
        break;

      default:
        throw new Error('Invalid User Type');
    }

    const baseParams = [fromDate, toDate, userType];

    const countResult = await this.dataSource.query(
      `
    SELECT COUNT(*) as total FROM (
      SELECT b.user_id
      FROM ${tableName} a
      JOIN loandocx_users_profile b ON ${joinCondition}
      WHERE ${dateColumn} >= ?
        AND ${dateColumn} <= ?
        AND b.user_type = ?
        AND a.payment_done = 'N'
      GROUP BY b.user_id
    ) as counted
    `,
      baseParams,
    );

    const totalCount = countResult[0]?.total || 0;

    const paymentList = await this.dataSource.query(
      `
    SELECT 
      b.user_name,
      b.mobile_number,
      b.upi_id,
      b.user_id,
      SUM(a.account_balance) AS payment_amount
    FROM ${tableName} a
    JOIN loandocx_users_profile b ON ${joinCondition}
    WHERE ${dateColumn} >= ?
      AND ${dateColumn} <= ?
      AND b.user_type = ?
      AND a.payment_done = 'N'
    GROUP BY b.user_name, b.mobile_number, b.upi_id, b.user_id
    ORDER BY b.user_id DESC
    LIMIT ?
    OFFSET ?
    `,
      [...baseParams, limit, offset],
    );

    return {
      paymentList,
      count: totalCount,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit),
    };
  }

  async adminPayoutValidateUser(queryParams: { userType: string, userId: number }) {
    const { userType, userId } = queryParams;

    if (!userType || !userId) {
      throw new BadRequestException('userType and userId are required');
    }

    const result = await this.dataSource.query(
      `
    SELECT user_name
    FROM loandocx_users_profile
    WHERE user_id = ?
      AND user_type = ?
      AND user_active = 'Y'
  `,
      [userId, userType],
    );

    if (result.length > 0) {
      return {
        success: true,
        userName: result[0].user_name,
      };
    }

    throw new NotFoundException(
      'Invalid user or account inactive.',
    );
  }

  async getDashboardStats() {
    const atPayout = await this.dataSource.query(
      `SELECT IFNULL(SUM(account_balance), 0) as total 
       FROM loandocx_daywise_agent_balance 
       WHERE payment_done = 'N'`
    );

    const luPayout = await this.dataSource.query(
      `SELECT IFNULL(SUM(account_balance), 0) as total 
       FROM loandocx_daywise_legal_user_balance 
       WHERE payment_done = 'N'`
    );

    const lhPayout = await this.dataSource.query(
      `SELECT IFNULL(SUM(account_balance), 0) as total 
       FROM loandocx_daywise_legal_head_balance 
       WHERE payment_done = 'N'`
    );

    const cuPayout = await this.dataSource.query(
      `SELECT IFNULL(SUM(account_balance), 0) as total 
       FROM loandocx_daywise_civil_user_balance 
       WHERE payment_done = 'N'`
    );

    const adminPending = await this.dataSource.query(
      `SELECT COUNT(*) as count 
       FROM loandocx_transactions 
       WHERE transaction_state = 'P'`
    );

    const legalPending = await this.dataSource.query(
      `SELECT COUNT(*) as count 
       FROM loandocx_transactions 
       WHERE transaction_state = 'A' 
       AND legal_head_job_completion_date IS NULL`
    );

    const civilPending = await this.dataSource.query(
      `SELECT COUNT(*) as count 
       FROM loandocx_transactions 
       WHERE transaction_state = 'A' 
       AND civil_team_job_completion_date IS NULL`
    );

    return {
      payouts: {
        agent: atPayout[0]?.total || 0,
        legalUser: luPayout[0]?.total || 0,
        legalHead: lhPayout[0]?.total || 0,
        civilUser: cuPayout[0]?.total || 0,
      },
      pending: {
        admin: adminPending[0]?.count || 0,
        legal: legalPending[0]?.count || 0,
        civil: civilPending[0]?.count || 0,
      },
    };
  }

  async archiveCompletedTransactions() {
    const config = await this.dataSource.query(`
      SELECT param_value 
      FROM loandocx_config_params 
      WHERE param_name = 'TRAN_ARCHIVE_DAYS'
      LIMIT 1
    `);

    if (!config.length) {
      return `Transaction data not configured`;
    }
    const archiveDays = Number(config[0].param_value);

    const transactions = await this.dataSource.query(
      `SELECT t.*
      FROM loandocx_transactions t
      INNER JOIN loandocx_customers_loan_details c
        ON c.transaction_id = t.transaction_id
      WHERE t.legal_head_job_completion_date IS NOT NULL
      AND t.civil_team_job_completion_date IS NOT NULL
      AND t.legal_team_job_completion_date IS NOT NULL
      AND DATEDIFF(CURDATE(), t.legal_head_job_completion_date) > ?
      AND c.Document_Stored_path IS NOT NULL
      AND c.Document_Stored_path <> ''
      AND NOT EXISTS (
        SELECT 1 
        FROM loandocx_transactions_archive a
        WHERE a.transaction_id = t.transaction_id
      )
      `,
      [archiveDays],
    );

    //Insert one by one using Entity
    for (const txn of transactions) {
      const archiveTransaction = this.dataSource.manager.create(
        TransactionArchive,
        { ...txn },
      );
      await this.dataSource.manager.save(archiveTransaction);
    }

    //Delete S3 folders (unique customers)
    const uniqueCustomers = [
      ...new Set(transactions.map(t => t.customer_id))
    ];

    for (const customerId of uniqueCustomers) {
      const folderName = `uploads/${customerId}/`;
      await this.s3Service.deleteFolder(folderName);
    }
    return `${transactions.length} transactions archived successfully`;
  }

  async adminCustomerDetails (query: string, type: 'mobile' | 'customer_id'){
    let customer: any = null;
    if (type === 'mobile') {
      const results = await this.dataSource.query(
        `
        SELECT 
          customer_id, 
          customer_name, 
          loan_name, 
          address1,
          address2,
          mobile_number,
          loan_amount,
          agent_id
        FROM loandocx_customers_loan_details
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
          address1,
          address2,
          mobile_number,
          loan_amount,
          agent_id
        FROM loandocx_customers_loan_details
        WHERE customer_id = ?
        `,
        [query],
      );

      customer = results[0];
    }
    else {
      return {
        customer: null,
        message: 'Invalid search type'
      }
    }

    if (!customer || customer.length === 0) {
      return {
        customer: null,
        message: 'Customer not found'
      };
    }
    return customer;
  }

  async adminUserDetails (queryParams: { limit?: number; page?: number, userType: string }){
    const limit = Number(queryParams.limit) || 10;
    const page = Number(queryParams.page) || 1;
    const offset = (page - 1) * limit;

    const countResult = await this.dataSource.query(
      `
      SELECT COUNT(*) as total
      FROM loandocx_users_profile c
      WHERE c.user_type = ?
      `,
      [queryParams.userType],
    );

    const totalCount = countResult[0]?.total || 0;
    const AdminUserList = await this.dataSource.query(
      `
      SELECT 
        c.user_id,
        c.user_name,
        c.upi_id,
        c.address1,
        c.address2,
        c.mobile_number,
        c.email_id,
        c.aadhar_number,
        c.user_active,
        c.user_type
      FROM loandocx_users_profile c
      WHERE c.user_type = ?
      ORDER BY c.user_id DESC
      LIMIT ?
      OFFSET ?
      `,
      [queryParams.userType, limit, offset],
    );

    return {
      AdminUserList,
      count: totalCount,
      page,
      limit,
      totalPages: Math.ceil(countResult[0].total / limit),
    };
  }

  async adminPendingTransReport(queryParams: { userType: string, limit?: number, page?: number }) {
    const { userType } = queryParams;

    const limit = Number(queryParams.limit) || 10;
    const page = Number(queryParams.page) || 1;
    const offset = (page - 1) * limit;

    let selectColumns = '';
    let whereCondition = '';

    switch (userType) {
      case 'LU':
        selectColumns = `
        transaction_id, customer_id, loan_name, agent_id,
        legal_team_user AS team_user_id,
        legal_team_job_allocation_date AS allocation_date
      `;
        whereCondition = `transaction_state = 'A' AND legal_team_job_completion_date IS NULL`;
        break;

      case 'CU':
        selectColumns = `
        transaction_id, customer_id, loan_name, agent_id,
        civil_team_user AS team_user_id,
        civil_team_job_allocation_date AS allocation_date
      `;
        whereCondition = `transaction_state = 'A' AND civil_team_job_completion_date IS NULL`;
        break;

      case 'LH':
        selectColumns = `
        transaction_id, customer_id, loan_name, agent_id,
        legal_head_user AS team_user_id,
        legal_head_job_allocation_date AS allocation_date
      `;
        whereCondition = `
        transaction_state = 'A'
        AND legal_team_job_completion_date IS NOT NULL
        AND legal_head_job_completion_date IS NULL
      `;
        break;

      default:
        throw new Error('Invalid user type selected');
    }

    const countResult = await this.dataSource.query(
      `
    SELECT COUNT(*) as total
    FROM loandocx_transactions
    WHERE ${whereCondition}
    `,
    );

    const totalCount = countResult[0]?.total || 0;

    const records = await this.dataSource.query(
      `
    SELECT ${selectColumns}
    FROM loandocx_transactions
    WHERE ${whereCondition}
    ORDER BY transaction_id DESC
    LIMIT ?
    OFFSET ?
    `,
      [limit, offset],
    );

    return {
      records,
      count: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async SentApprovalMSGToCustomer(manager: EntityManager, transactionId, messageTo: string, messageId: string, type: string) {
    const [transaction] = await manager.query(
      `SELECT *
     FROM loandocx_transactions
     WHERE transaction_id = ?
     LIMIT 1`,
      [transactionId],
    );
    if (!transaction) return false;

    const [customer, templateRow] = await Promise.all([
      manager.query(
        `SELECT mobile_number, processing_fees
       FROM loandocx_customers_loan_details
       WHERE transaction_id = ?`,
        [transactionId],
      ),
      manager.query(
        `SELECT message_content
       FROM loandocx_message_notifications
       WHERE message_to = ? AND message_id = ?
       LIMIT 1`,
        [messageTo, messageId],
      ),
    ]);

    if (!customer.length) {
      throw new BadRequestException('Customer not found');
    }

    if (!templateRow.length) {
      throw new BadRequestException('Message template not found');
    }

    const cust = customer[0];
    let message = templateRow[0].message_content;

    let shouldSend = false;

    switch (type) {
      case 'adminApprove':
        shouldSend =
          transaction.legal_team_job_allocation_date &&
          transaction.civil_team_job_allocation_date &&
          transaction.transaction_state === 'A';

        if (shouldSend) {
          message = message.replace(
            '<Processing fees>',
            cust.processing_fees,
          );
        }
        break;

      case 'civilApprove':
        shouldSend =
          transaction.civil_team_job_completion_date &&
          transaction.civil_courier_date;
        break;

      case 'legalApprove':
        shouldSend =
          transaction.legal_team_job_completion_date &&
          transaction.legal_team_report;
        break;

      case 'legalHeadApprove':
        shouldSend =
          transaction.legal_head_job_completion_date &&
          transaction.legal_team_job_completion_date &&
          transaction.civil_team_job_completion_date;
        break;
      default:
        throw new Error('Invalid User Type');
    }

    if (shouldSend) {
      await this.sendSMS(cust.mobile_number, message);
      return true;
    }

    return false;
  }

  async SentAssignJobMSGToUser(manager: EntityManager, transactionId, messageTo: string, messageId: string, type: string, userId?: any, userType?: any) {
    const [transaction] = await manager.query(
      `SELECT *
     FROM loandocx_transactions
     WHERE transaction_id = ?
     LIMIT 1`,
      [transactionId],
    );
    if (!transaction) return false;

    const [templateRow, user] = await Promise.all([
      manager.query(
        `SELECT message_content
       FROM loandocx_message_notifications
       WHERE message_to = ? AND message_id = ?
       LIMIT 1`,
        [messageTo, messageId],
      ),
      manager.query(
        `SELECT mobile_number
        FROM loandocx_users_profile
        WHERE user_id = ?
        AND user_type = ?
        AND user_active = 'Y'
        LIMIT 1`,
        [userId, userType],
      ),
    ]);

    if (!templateRow.length) {
      throw new BadRequestException('Message template not found');
    }

    if (!user.length) {
      throw new BadRequestException('user detail not found');
    }

    let message = templateRow[0].message_content;
    const userMobile = user[0];

    let shouldSend = false;
    let smsSendNumber = '';

    switch (type) {
      case 'adminJobAssign':
        shouldSend =
          transaction.customer_id &&
          transaction.trans_creation_date &&
          transaction.transaction_state === 'P';
        if (shouldSend) {
          message = message.replace(
            '<Tran id>',
            transaction.transaction_id,
          );
        }
        smsSendNumber = userMobile.mobile_number
        break;
      case 'legalJobAssign':
        shouldSend =
          transaction.legal_team_job_allocation_date &&
          transaction.transaction_state === 'A';
        if (shouldSend) {
          message = message.replace(
            '<Tran id>',
            transaction.transaction_id,
          );
        }
        smsSendNumber = userMobile.mobile_number
        break;
      case 'civilJobAssign':
        shouldSend =
          transaction.civil_team_job_allocation_date &&
          transaction.transaction_state === 'A';
        if (shouldSend) {
          message = message.replace(
            '<Tran id>',
            transaction.transaction_id,
          );
        }
        smsSendNumber = userMobile.mobile_number
        break;
      case 'legalHeadJobAssign':
        shouldSend =
          transaction.legal_team_job_completion_date &&
          transaction.legal_head_job_allocation_date &&
          transaction.transaction_state === 'A';
        if (shouldSend) {
          message = message.replace(
            '<Tran id>',
            transaction.transaction_id,
          );
        }
        smsSendNumber = userMobile.mobile_number
        break;
      default:
        throw new Error('Invalid User Type');
    }

    if (shouldSend) {
      await this.sendSMS(smsSendNumber, message);
      return true;
    }

    return false;
  }

  async sendSMS(mobile: string, message: string) {
    console.log(`Sending SMS to: ${mobile}`);
    console.log(`Message: ${message}`);
    // Call your SMS provider API here
  }

}