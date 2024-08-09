import { Injectable, Logger } from '@nestjs/common';
const { Client } = require('pg');

@Injectable()
export class V1DBClient {
  connectionProps = {
    user: process.env.V1_DB_USER,
    password: process.env.V1_DB_PWD,
    host: process.env.V1_DB_HOST,
    port: process.env.V1_DB_PORT,
    database: process.env.V1_DB_NAME,
  };

  statement = 'SELECT balance FROM cards where partner_card_id = $1';

  async getBalanaceByCard(cardId: string): Promise<any> {
    try {
      const client = new Client(this.connectionProps);
      const resultset = await new Promise(async (resolve, reject) => {
        await client
          .connect()
          .then(async () => {
            Logger.log(
              'Successfuly connected to V1 DB database',
              V1DBClient.name,
            );
            client.query(this.statement, [cardId], (err: any, result: any) => {
              if (err) {
                reject(err);
              } else {
                resolve(result.rows);
              }
              client
                .end()
                .then(() => {
                  Logger.log(
                    'Connection to V1 DB successfuly closed',
                    V1DBClient.name,
                  );
                })
                .catch((err: any) => {
                  Logger.error(
                    `Error closing connection ${err}`,
                    V1DBClient.name,
                  );
                });
            });
          })
          .catch((err: any) => {
            Logger.error(
              `Error connecting to V1 DB database ${err}`,
              V1DBClient.name,
            );
          });
      });
      return resultset[0]?.balance;
    } catch (error) {
      Logger.error(error, V1DBClient.name);
    }
  }
}
