import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Client } from 'pg';
import { Logger } from 'winston';

import { Traceable } from '@amplication/opentelemetry-nestjs';

@Traceable()
@Injectable()
export class PomeloV1DBClient {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  private connectionProps = {
    user: process.env.V1_DB_USER,
    password: process.env.V1_DB_PWD,
    host: process.env.V1_DB_HOST,
    port: process.env.V1_DB_PORT,
    database: process.env.V1_DB_NAME,
  };

  private statement = 'SELECT balance FROM cards where partner_card_id = $1';

  async getBalanaceByCard(cardId: string): Promise<any> {
    try {
      const client = new Client(this.connectionProps);
      const resultset = await new Promise(async (resolve, reject) => {
        await client
          .connect()
          .then(async () => {
            this.logger.debug(
              'Successfuly connected to V1 DB database',
              PomeloV1DBClient.name,
            );
            client.query(this.statement, [cardId], (err: any, result: any) => {
              if (err) {
                reject(err);
              } else {
                this.logger.debug(
                  'PomeloV1DBClient.getBalanaceByCard:result.rows',
                  result.rows,
                );
                resolve(result.rows);
              }
              client
                .end()
                .then(() => {
                  this.logger.debug(
                    'Connection to V1 DB successfuly closed',
                    PomeloV1DBClient.name,
                  );
                })
                .catch((err: any) => {
                  this.logger.error(
                    `Error closing connection ${err}`,
                    PomeloV1DBClient.name,
                  );
                });
            });
          })
          .catch((err: any) => {
            this.logger.error(
              `Error connecting to V1 DB database ${err}`,
              PomeloV1DBClient.name,
            );
          });
      });
      return resultset[0]?.balance;
    } catch (error) {
      this.logger.error(PomeloV1DBClient.name, error);
    }
  }
}
