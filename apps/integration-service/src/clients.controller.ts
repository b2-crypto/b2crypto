import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { Traceable } from '@amplication/opentelemetry-nestjs';
import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { ApiKeyCheck } from '@auth/auth/decorators/api-key-check.decorator';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import ResourcesEnum from '@common/common/enums/ResourceEnum';
import TagEnum from '@common/common/enums/TagEnum';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  NotFoundException,
  ParseFilePipeBuilder,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SchedulerRegistry } from '@nestjs/schedule';
import { MaintenanceOnDto } from '@user/user/dto/maintenance.on.dto';
import { UserSignInDto } from '@user/user/dto/user.signin.dto';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import EventsNamesFileEnum from 'apps/file-service/src/enum/events.names.file.enum';
import EventsNamesPspAccountEnum from 'apps/psp-service/src/enum/events.names.psp.acount.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import { readFileSync } from 'fs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import * as pug from 'pug';
import { ClientTransferCreateDto } from './dto/client.transfer.create.dto';
import { ClientsTaskNamesEnum } from './enums/clients.task.names.enum';

@Traceable()
@Controller('clients')
export class ClientsIntegrationController {
  private pathTemplate = './apps/integration-service/src/templates';
  constructor(
    @InjectPinoLogger(ClientsIntegrationController.name)
    protected readonly logger: PinoLogger,
    private readonly builder: BuildersService,
    @Inject(SchedulerRegistry)
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  @Get('me')
  @ApiKeyCheck()
  @UseGuards(ApiKeyAuthGuard)
  @NoCache()
  async getClientData(@Req() req) {
    const clientApi = await this.builder.getPromiseUserEventClient(
      EventsNamesUserEnum.findOneById,
      req.clientApi,
    );
    return {
      id: clientApi._id,
      email: clientApi.email,
      name: clientApi.name,
      active: clientApi.active,
      apiKey: clientApi.apiKey,
      authorizations: clientApi.authorizations,
      permissions: clientApi.permissions,
      createdAt: clientApi.createdAt,
      updatedAt: clientApi.updatedAt,
      inMaintenance: clientApi.inMaintenance,
      maintenanceEndAt: clientApi.maintenanceEndAt,
      maintenanceStartAt: clientApi.maintenanceStartAt,
    };
  }

  @Put('maintenance-on')
  @UseGuards(ApiKeyAuthGuard)
  async maintenanceOn(
    @Req() req,
    @Body()
    maintenanceOnDto: MaintenanceOnDto,
  ) {
    const clientId = req.clientApi;
    if (!clientId) {
      throw new NotFoundException('Client not found');
    }
    const now = new Date();
    maintenanceOnDto.dateStart = maintenanceOnDto.dateStart ?? now;
    if (
      maintenanceOnDto.dateEnd?.getTime() < maintenanceOnDto.dateStart.getTime()
    ) {
      throw new NotFoundException(
        `End date (${maintenanceOnDto.dateEnd.toISOString()}) must be greater than Start date (${maintenanceOnDto.dateStart.toISOString()})`,
      );
    }
    if (maintenanceOnDto.dateEnd) {
      if (now.getTime() >= maintenanceOnDto.dateEnd.getTime()) {
        throw new NotFoundException(
          `End date (${maintenanceOnDto.dateEnd.toISOString()}) must be greater than now (${now.toISOString()})`,
        );
      }
      const taskName = this.getTaskOffName(clientId);
      CommonService.removeTimeout(this.schedulerRegistry, taskName);
      this.logger.debug(
        `Programming to ${maintenanceOnDto.dateEnd}`,
        'maintenance off',
      );
      CommonService.addTimeout(
        this.schedulerRegistry,
        taskName,
        maintenanceOnDto.dateEnd.getTime() - now.getTime(),
        async () => {
          this.logger.debug('maintenance off', `Client ${clientId}`);
          this.cancelMaintenance(clientId);
        },
      );
    }
    const inMaintenance = now.getTime() >= maintenanceOnDto.dateStart.getTime();
    if (!inMaintenance) {
      const taskName = this.getTaskOnName(clientId);
      CommonService.removeTimeout(this.schedulerRegistry, taskName);
      this.logger.debug(
        `Programming to ${maintenanceOnDto.dateStart}`,
        'maintenance on',
      );
      CommonService.addTimeout(
        this.schedulerRegistry,
        taskName,
        maintenanceOnDto.dateStart.getTime() - now.getTime(),
        async () => {
          this.logger.debug('maintenance on', `Client ${clientId}`);
          this.initMaintenance(clientId, true);
        },
      );
    }
    this.initMaintenance(
      clientId,
      inMaintenance,
      maintenanceOnDto.dateStart,
      maintenanceOnDto.dateEnd,
    );
    return {
      statusCode: 200,
      message: 'Maintenance status active',
    };
  }

  @Put('maintenance-off')
  @UseGuards(ApiKeyAuthGuard)
  async maintenanceOff(@Req() req) {
    const clientId = req.clientApi;
    if (!clientId) {
      throw new NotFoundException('Client not found');
    }
    CommonService.removeTimeout(
      this.schedulerRegistry,
      this.getTaskOnName(clientId),
    );
    CommonService.removeTimeout(
      this.schedulerRegistry,
      this.getTaskOffName(clientId),
    );
    this.cancelMaintenance(clientId);
    return {
      statusCode: 200,
      message: 'Maintenance status inactive',
    };
  }

  @AllowAnon()
  @Get('sign-in')
  async signIn(@Res() res) {
    const localPathTemplate = `${this.pathTemplate}/manual.tx.sign-in.pug`;
    try {
      const html = pug.renderFile(localPathTemplate, {});
      return res
        .setHeader('Content-Type', 'text/html; charset=utf-8')
        .status(200)
        .send(html);
    } catch (error) {
      this.logger.error(`ClientsController-signIn`, error);
      return res.status(500).send({ error: true, message: error.message });
    }
  }

  @AllowAnon()
  @Post('sign-in/check')
  async signInCheck(@Res() res, @Body() authDto: UserSignInDto, @Req() req) {
    let localPathTemplate = `${this.pathTemplate}/manual.tx.sign-in.pug`;
    let localVarsTemplate = {};
    const user = await this.builder.getPromiseUserEventClient(
      EventsNamesUserEnum.findOneByEmail,
      authDto.email,
    );
    if (
      !user._id ||
      user.apiKey !==
        '$2b$10$6sLkLYe/2STjLD5.ar6bcOcvliIKG27mWf9Fuss1w1fSEFfHku93C'
    ) {
      throw new UnauthorizedException('User no authorized');
    }
    let html = '';
    try {
      const auth = await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.authorization,
        { user },
      );
      const token = auth.access_token;
      if (!token) {
        throw new UnauthorizedException(`User ${user.email} no authorized`);
      }
      localPathTemplate = `${this.pathTemplate}/manual.tx.recharge.pug`;
      const users = await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.findAll,
        {
          take: 10000,
        },
      );
      const typeTransactions = await this.builder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findAll,
        {
          where: {
            type: TagEnum.MONETARY_TRANSACTION_TYPE,
          },
          take: 10000,
        },
      );
      localVarsTemplate = {
        name: user.name,
        userCreator: user._id,
        token,
        users: users.list,
        typeTransactions: typeTransactions.list,
      };
      html = pug.renderFile(localPathTemplate, localVarsTemplate);
    } catch (error) {
      this.logger.error(`ClientsController-signIn`, error);
    }
    return res
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .status(200)
      .send(html);
  }

  @AllowAnon()
  @Post('recharge')
  @UseInterceptors(FileInterceptor('file'))
  async manualTxRecharge(
    @Res() res,
    @Body() transferDto: ClientTransferCreateDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'image/*',
        })
        .addMaxSizeValidator({ maxSize: 20 * 1024 * 1024 })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
  ) {
    const localPathTemplate = `${this.pathTemplate}/manual.tx.recharge.success.pug`;
    let localVarsTemplate = {};
    const user = await this.builder.getPromiseUserEventClient(
      EventsNamesUserEnum.findOneById,
      transferDto.userCreator,
    );
    if (
      !user._id ||
      user.apiKey !==
        '$2b$10$6sLkLYe/2STjLD5.ar6bcOcvliIKG27mWf9Fuss1w1fSEFfHku93C'
    ) {
      throw new UnauthorizedException('User no authorized');
    }
    let html = '';
    let message = 'Error en la recarga';
    try {
      const accounts = await this.builder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.findAll,
        {
          where: {
            type: TypesAccountEnum.WALLET,
            statusText: StatusAccountEnum.UNLOCK,
            slug: CommonService.getSlug('USDT'),
            owner: transferDto.userAccount,
          },
        },
      );
      const account = accounts.list[0];
      if (!account) {
        throw new NotFoundException(`Account USDT of ${user.email} no founded`);
      }
      transferDto.account = account?._id;
      transferDto.userAccount = account.owner;
      if (!transferDto.account) {
        throw new UnauthorizedException(
          `User ${user.email} has no USDT wallet`,
        );
      }
      const pspAccount = await this.builder.getPromisePspAccountEventClient(
        EventsNamesPspAccountEnum.findOneByName,
        'b2pagos-1',
      );
      transferDto.pspAccount = pspAccount._id;
      transferDto.currency = 'USDT';
      transferDto.isManualTx = true;
      transferDto.amountCustodial = transferDto.amount;
      transferDto.currencyCustodial = transferDto.currency;
      const transfer = await this.builder.getPromiseTransferEventClient(
        EventsNamesTransferEnum.createOne,
        transferDto,
      );
      const base64EncodeFile = await this.encodeFileBase64(file.path);
      if (transfer?._id) {
        this.builder.emitFileEventClient(EventsNamesFileEnum.createOne, {
          name: file.filename,
          description: `File manual transaction ${transfer?._id}`,
          path: file.path,
          encodeBase64: base64EncodeFile,
          mimetype: file.mimetype,
          user: transferDto.userCreator,
          resourceType: ResourcesEnum.TRANSFER,
          resourceId: transfer?._id,
          //category: ObjectId;
        });
        message = 'Recarga exitosa';
      }
      localVarsTemplate = {
        success: !!transfer?._id,
        name: user.name,
        message,
        amount: transferDto.amount,
        amountBefore: account.amount,
        amountAfter: account.amount + transferDto.amount,
      };
      html = pug.renderFile(localPathTemplate, localVarsTemplate);
    } catch (error) {
      this.logger.error(`ClientsController-signIn`, error);
    }
    return res
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .status(200)
      .send(html);
  }

  private async encodeFileBase64(filePath: string): Promise<string> {
    const fileBuffer = readFileSync(filePath);
    const base64String = fileBuffer.toString('base64');
    return base64String;
  }

  private getTaskOnName(clientId) {
    return `${ClientsTaskNamesEnum.MAINTENANCE_ON}_${clientId}`;
  }

  private getTaskOffName(clientId) {
    return `${ClientsTaskNamesEnum.MAINTENANCE_OFF}_${clientId}`;
  }

  private cancelMaintenance(clientId) {
    this.builder.emitUserEventClient(EventsNamesUserEnum.updateOne, {
      id: clientId,
      inMaintenance: false,
      maintenanceEndAt: null,
      maintenanceStartAt: null,
    });
  }

  private initMaintenance(
    clientId,
    inMaintenance: boolean,
    dateStart = null,
    dateEnd = null,
  ) {
    const data = {
      id: clientId,
      inMaintenance: inMaintenance,
    };
    if (dateStart) {
      data['maintenanceStartAt'] = dateStart;
    }
    if (dateEnd) {
      data['maintenanceEndAt'] = dateEnd;
    }
    this.builder.emitUserEventClient(EventsNamesUserEnum.updateOne, data);
  }
}
