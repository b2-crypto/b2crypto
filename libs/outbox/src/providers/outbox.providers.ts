import { Connection } from 'mongoose';
import * as mongooseSlugUpdater from 'mongoose-slug-updater';
import { OutboxSchema } from '../schemas/outbox.schema';

export const outboxProviders = [
  {
    provide: 'OUTBOX_MODEL_MONGOOSE',
    useFactory: (connection: Connection) => {
      connection.plugin(mongooseSlugUpdater);

      return connection.model('outbox', OutboxSchema);
    },
    inject: ['MONGOOSE_CONNECTION'],
  },
];
