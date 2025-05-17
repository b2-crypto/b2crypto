import { Traceable } from '@amplication/opentelemetry-nestjs';
import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
// const { Client } = require('pg');
import { Client } from 'pg';

@Traceable()
@Injectable()
export class PomeloV1DBClient {
  constructor(
    @InjectPinoLogger(PomeloV1DBClient.name)
    protected readonly logger: PinoLogger,
  ) {}

  private connectionProps = {
    user: process.env.V1_DB_USER,
    password: process.env.V1_DB_PWD,
    host: process.env.V1_DB_HOST,
    port: Number(process.env.V1_DB_PORT),
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
            this.logger.info(
              `[getBalanaceByCard] Successfuly connected to V1 DB database`,
            );
            client.query(this.statement, [cardId], (err: any, result: any) => {
              if (err) {
                reject(err);
              } else {
                this.logger.info(
                  'PomeloV1DBClient.getBalanaceByCard:result.rows',
                  result.rows,
                );
                resolve(result.rows);
              }
              client
                .end()
                .then(() => {
                  this.logger.info(
                    `[getBalanaceByCard] Connection to V1 DB successfuly closed`,
                  );
                })
                .catch((err: any) => {
                  this.logger.error(
                    `[getBalanaceByCard] Error closing connection ${
                      err.message || err
                    }`,
                  );
                });
            });
          })
          .catch((err: any) => {
            this.logger.error(
              `[getBalanaceByCard] Error connecting to V1 DB database ${
                err.message || err
              }`,
            );
          });
      });
      return resultset[0]?.balance;
    } catch (error) {
      this.logger.error(`[getBalanaceByCard] ${error.message || error}`);
    }
  }
}
