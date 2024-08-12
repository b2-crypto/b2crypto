import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AffiliateServiceModule } from 'apps/affiliate-service/src/affiliate-service.module';
import { CategoryServiceModule } from 'apps/category-service/src/category-service.module';
import { CrmServiceModule } from 'apps/crm-service/src/crm-service.module';
import { LeadServiceModule } from 'apps/lead-service/src/lead-service.module';
import { PermissionServiceModule } from 'apps/permission-service/src/permission-service.module';
import { RoleServiceModule } from 'apps/role-service/src/role-service.module';
import { StatusServiceModule } from 'apps/status-service/src/status-service.module';
import * as basicAuth from 'express-basic-auth';
import { UserServiceModule } from '../../user-service/src/user-service.module';
import { AppHttpModule } from './app.http.module';

import { OpenAPIObject } from '@nestjs/swagger';
import { PathsObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { TransferServiceModule } from 'apps/transfer-service/src/transfer-service.module';
import { PersonServiceModule } from 'apps/person-service/src/person-service.module';
import { AccountServiceModule } from 'apps/account-service/src/account-service.module';
import { SwaggerSteakeyConfigEnum } from 'libs/config/enum/swagger.stakey.config.enum';

async function bootstrap(port?: number | string) {
  Logger.log(process.env.TZ, 'Timezone Gateway');
  port = port ?? process.env.PORT ?? 3000;
  const app = await NestFactory.create(AppHttpModule, {
    // logger: false,
    cors: true,
  });

  const validationPipes = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  });

  app.useGlobalPipes(validationPipes);

  addSwaggerGlobal(app);
  addSwaggerLead(app);
  addSwaggerIntegration(app);
  addSwaggerStakeyCard(app);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    allowedHeaders:
      'b2crypto-affiliate-key b2crypto-key Content-Type Accept,Authorization',
  });
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  await app.listen(port);
  if (typeof process.send === 'function') {
    process.send('ready');
  }
}

function addSwaggerStakeyCard(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('B2crypto Api Stakey Card')
    .setDescription('The b2crypto api stakey card endpoints')
    .setVersion('1.0')
    .addTag(SwaggerSteakeyConfigEnum.TAG_SECURITY)
    .addTag(SwaggerSteakeyConfigEnum.TAG_PROFILE)
    .addTag(SwaggerSteakeyConfigEnum.TAG_DEPOSIT)
    .addTag(SwaggerSteakeyConfigEnum.TAG_CARD)
    .addTag(SwaggerSteakeyConfigEnum.TAG_WALLET)
    .addTag(SwaggerSteakeyConfigEnum.TAG_LIST)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearerToken',
    )
    .addApiKey(
      {
        type: 'apiKey',
        description: 'ApiKey to endpoints',
      },
      'b2crypto-key',
    )
    .build();
  const stakeyCardDocument = SwaggerModule.createDocument(app, config, {
    include: [
      UserServiceModule,
      PersonServiceModule,
      TransferServiceModule,
      AccountServiceModule,
      CategoryServiceModule,
    ],
  });

  stakeyCardDocument.paths = filterDocumentsPathsByTags(stakeyCardDocument);
  SwaggerModule.setup('api/stakey-card', app, stakeyCardDocument, {
    swaggerOptions: { defaultModelsExpandDepth: -1 },
  });
}

function addSwaggerLead(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('B2crypto Api Affiliate')
    .setDescription('The b2crypto api affiliate endpoints')
    .setVersion('1.0')
    .addTag('Affiliate Lead')
    .addTag('Affiliate Category')
    .build();
  const leadDocument = SwaggerModule.createDocument(app, config, {
    include: [LeadServiceModule, CategoryServiceModule],
  });

  leadDocument.paths = filterDocumentsPathsByTags(leadDocument);
  SwaggerModule.setup('api/lead', app, leadDocument, {
    swaggerOptions: { defaultModelsExpandDepth: -1 },
  });
}

function addSwaggerIntegration(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('B2crypto Api Integration')
    .setDescription('The b2crypto api integration endpoints')
    .setVersion('1.0')
    .addTag('Integration Lead')
    .addTag('Integration Category')
    .build();
  const integrationDocument = SwaggerModule.createDocument(app, config, {
    include: [LeadServiceModule, CategoryServiceModule, TransferServiceModule],
  });

  integrationDocument.paths = filterDocumentsPathsByTags(integrationDocument);
  SwaggerModule.setup('api/integration', app, integrationDocument, {
    swaggerOptions: { defaultModelsExpandDepth: -1 },
  });
}

function addSwaggerGlobal(app: INestApplication) {
  app.use(
    ['/docs'],
    basicAuth({
      challenge: true,
      users: {
        [process.env.SWAGGER_USER || 'SWAGGER_USER']:
          process.env.SWAGGER_PASSWORD || 'B2Crypto_swagger',
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('B2crypto Api')
    .setDescription('The b2crypto api endpoints')
    .setVersion('1.0')
    .addBearerAuth(
      {
        scheme: 'Bearer',
        bearerFormat: 'JWT',
        type: 'http',
        in: 'header',
      },
      'bearer',
    )
    .build();

  const globalDocument = SwaggerModule.createDocument(app, config, {
    include: [
      CrmServiceModule,
      UserServiceModule,
      RoleServiceModule,
      LeadServiceModule,
      StatusServiceModule,
      AffiliateServiceModule,
      PermissionServiceModule,
    ],
  });

  SwaggerModule.setup('docs', app, globalDocument);
}

const arrayIntersect = (array1: string[], array2: string[]): string[] =>
  array1.filter((item) => array2.includes(item));

const filterDocumentsPathsByTags = (
  publicDocument: OpenAPIObject,
): PathsObject => {
  const result: PathsObject = {};

  const tags = publicDocument.tags.map(({ name }) => name);

  for (const path of Object.keys(publicDocument.paths)) {
    const pathMethods = {};

    for (const method of Object.keys(publicDocument.paths[path])) {
      const endpointTags = publicDocument.paths[path][method].tags;

      if (!Array.isArray(endpointTags)) {
        continue;
      }
      const intersect = arrayIntersect(tags, endpointTags);
      if (intersect.length > 0) {
        publicDocument.paths[path][method].tags = intersect;
        pathMethods[method] = publicDocument.paths[path][method];
      }
    }

    result[path] = pathMethods;
  }

  return result;
};

bootstrap();
//bootstrap(443);
