import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DataSource } from 'typeorm';

@Injectable()
export class S3Service {
  private s3: S3Client;

  constructor(
    private readonly dataSource: DataSource,
  ) {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async uploadFile(key: string, buffer: Buffer) {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf',
      }),
    );
  }

  async listFiles(prefix: string) {
    const result = await this.s3.send(
      new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET,
        Prefix: prefix,
      }),
    );

    return result.Contents || [];
  }

  // async getFilesByFolderId(folderId: string) {
  //   try {
  //     const prefix = `uploads/${folderId}/`;

  //     const listCommand = new ListObjectsV2Command({
  //       Bucket: process.env.AWS_S3_BUCKET,
  //       Prefix: prefix,
  //     });

  //     const response = await this.s3.send(listCommand);

  //     if (!response.Contents || response.Contents.length === 0) {
  //       return [];
  //     }

  //     const files = await Promise.all(
  //       response.Contents
  //         .filter((item) => item.Key !== prefix) // remove folder itself
  //         .map(async (item) => {
  //           const getCommand = new GetObjectCommand({
  //             Bucket: process.env.AWS_S3_BUCKET,
  //             Key: item.Key,
  //           });

  //           const signedUrl = await getSignedUrl(this.s3, getCommand, {
  //             expiresIn: 3600, // 1 hour expiry
  //           });

  //           return {
  //             fileName: item.Key?.replace(prefix, ''),
  //             key: item.Key,
  //             size: item.Size,
  //             lastModified: item.LastModified,
  //             url: signedUrl,
  //           };
  //         }),
  //     );

  //     return files;
  //   } catch (error) {
  //     console.error('S3 Error:', error);
  //     throw new InternalServerErrorException('Failed to fetch files from S3');
  //   }
  // }

  async getFilesByFolderId(folderId: string) {
    const cust = await this.dataSource.query(
      `SELECT customer_name, loan_name, transaction_id
     FROM loandocx_customers_loan_details
     WHERE customer_id = ?`,
      [folderId],
    );
    const customerData = cust[0];

    const checklist = await this.dataSource.query(
      `
      SELECT 
        c.doc_name,
        c.doc_description
      FROM loandocx_customers_loan_details d
      JOIN loandocx_loan_types t 
           ON t.loan_name = d.loan_name
      JOIN loandocx_loan_doc_checklist c 
           ON c.loan_id = t.loan_id
      WHERE d.customer_id = ?
      `,
          [folderId],
        );
    
    const checklistMap = new Map<string, any>();

    for (const doc of checklist) {
      checklistMap.set(doc.doc_name.toLowerCase(), doc.doc_description);
    }

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

    // if (response.Contents && response.Contents.length > 0) {
    //   for (const item of response.Contents) {
    //     if (!item.Key || item.Key === prefix) continue;

    //     const fileName = item.Key.replace(prefix, '');

    //     //  Extract base name before first "_"
    //     const baseName = fileName.split('_')[0];

    //     if (!fileMap.has(baseName)) {
    //       fileMap.set(baseName, item);
    //     } else {
    //       const existing = fileMap.get(baseName);

    //       const existingDate = existing.LastModified
    //         ? existing.LastModified.getTime()
    //         : 0;

    //       const currentDate = item.LastModified
    //         ? item.LastModified.getTime()
    //         : 0;

    //       if (currentDate > existingDate) {
    //         fileMap.set(baseName, item);
    //       }
    //     }
    //   }
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
    //     doc_name: baseName,
    //     doc_description: checklistMap.get(baseName.toLowerCase()) || null,
    //     fileName: item.Key.replace(prefix, ''),
    //     key: item.Key,
    //     lastModified: item.LastModified,
    //     size: item.Size,
    //     fileUrl: signedUrl
    //   });
    // }

    if (response.Contents && response.Contents.length > 0) {
      for (const item of response.Contents) {
        if (!item.Key || item.Key === prefix) continue;

        const fileName = item.Key.replace(prefix, '');
        const baseName = fileName.split('_')[0];

        const getCommand = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: item.Key,
        });

        const signedUrl = await getSignedUrl(this.s3, getCommand, {
          expiresIn: 3600,
        });

        result.push({
          doc_name: baseName,
          doc_description: checklistMap.get(baseName.toLowerCase()) || null,
          fileName: item.Key.replace(prefix, ''),
          key: item.Key,
          lastModified: item.LastModified,
          size: item.Size,
          fileUrl: signedUrl
        });
      }
    }
    return {
      customer: {
        customer_name: customerData.customer_name,
        loan_name: customerData.loan_name,
        transaction_id: customerData.transaction_id,
      },
      files: result,
    }
  }

  async deleteFolder(folderPath: string) {
    //List all objects under folder
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: folderPath,
    });

    const listedObjects = await this.s3.send(listCommand);

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      return;
    }

    //Prepare objects for deletion
    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Delete: {
        Objects: listedObjects.Contents.map((item) => ({
          Key: item.Key!,
        })),
      },
    };

    //Delete all objects
    await this.s3.send(new DeleteObjectsCommand(deleteParams));
    console.log(`Folder ${folderPath} deleted successfully`);
  }

}