import { AccountSchema } from '@account/account/entities/mongoose/account.schema';
import { Connection } from 'mongoose';
import * as mongooseSlugUpdater from 'mongoose-slug-updater';

export const accountProviders = [
  {
    provide: 'ACCOUNT_MODEL_MONGOOSE',
    useFactory: (connection: Connection) => {
      connection.plugin(mongooseSlugUpdater);
      return connection.model('accounts', AccountSchema);
    },
    inject: ['MONGOOSE_CONNECTION'],
  },
];
