import { BrandSchema } from '@brand/brand/entities/mongoose/brand.schema';
import { Connection } from 'mongoose';
import * as mongooseSlugUpdater from 'mongoose-slug-updater';

export const brandProviders = [
  {
    provide: 'BRAND_MODEL_MONGOOSE',
    useFactory: (connection: Connection) => {
      connection.plugin(mongooseSlugUpdater);
      return connection.model('brands', BrandSchema);
    },
    inject: ['MONGOOSE_CONNECTION'],
  },
];
