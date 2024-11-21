import { CardDepositCreateDto } from '@account/account/dto/card-deposit.create.dto';
import { CardCreateDto } from '@account/account/dto/card.create.dto';
import { ConfigCardActivateDto } from '@account/account/dto/config.card.activate.dto';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { SwaggerSteakeyConfigEnum } from 'libs/config/enum/swagger.stakey.config.enum';
import { CardIntegrationService } from './card-integration-service';
import { CardShippingService } from './Card/CardShippingService';
import { CardTransactionService } from './Card/CardTransactionService';
@ApiTags('CARD')
@Controller('cards')
export class CardServiceController {
  constructor(
    private readonly cardIntegrationService: CardIntegrationService,
    private readonly cardTransactionService: CardTransactionService,
    private readonly cardShippingService: CardShippingService,
  ) { }

  @Get('all')
  @NoCache()
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiBearerAuth('bearerToken')
  @ApiHeader({
    name: 'b2crypto-key',
    description: 'The apiKey',
  })
  async findAll(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    return this.cardTransactionService.findAll(query);
  }

  @Get('me')
  @NoCache()
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiBearerAuth('bearerToken')
  async findAllMe(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    console.log('findAllMe', query);
    return this.cardTransactionService.findAllMe(query, req);
  }

  @Post('create')
  @UseGuards(ApiKeyAuthGuard)
  async createOne(@Body() createDto: CardCreateDto, @Req() req: any) {
    return this.cardTransactionService.createCard(createDto, req.user);
  }

  @Post('recharge')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async rechargeCard(
    @Body() rechargeDto: CardDepositCreateDto,
    @Req() req?: any,
  ) {
    return this.cardTransactionService.rechargeCard(rechargeDto, req.user);
  }

  @Post('activate')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async activateCard(
    @Body() configActivate: ConfigCardActivateDto,
    @Req() req?: any,
  ) {
    try {
      return await this.cardIntegrationService.activateCard(
        req.user,
        configActivate,
      );
    } catch (error) {
      Logger.error(error, 'CardController - activateCard');
      throw new BadRequestException(error.message || 'Error activating card');
    }
  }

  @Patch('lock/:cardId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async blockedOneById(@Param('cardId') cardId: string) {
    return this.cardTransactionService.updateCardStatus(cardId, 'LOCK');
  }

  @Patch('unlock/:cardId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async unblockedOneById(@Param('cardId') cardId: string) {
    return this.cardTransactionService.updateCardStatus(cardId, 'UNLOCK');
  }

  @Patch('cancel/:cardId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async cancelOneById(@Param('cardId') cardId: string) {
    return this.cardTransactionService.updateCardStatus(cardId, 'CANCEL');
  }

  @Patch('hidden/:cardId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async disableOneById(@Param('cardId') cardId: string) {
    return this.cardTransactionService.updateVisibility(cardId, false);
  }

  @Patch('visible/:cardId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async enableOneById(@Param('cardId') cardId: string) {
    return this.cardTransactionService.updateVisibility(cardId, true);
  }

  @Get('status/:cardId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async getCardStatus(@Param('cardId') cardId: string) {
    try {
      return await this.cardIntegrationService.getCardStatus(cardId);
    } catch (error) {
      Logger.error(error, 'CardController - getCardStatus');
      throw new BadRequestException(
        error.message || 'Error getting card status',
      );
    }
  }

  @Get('shipping/:cardId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async getShippingPhysicalCard(
    @Param('cardId') cardId: string,
    @Req() req?: any,
  ) {
    try {
      await this.cardShippingService.getShippingPhysicalCard(cardId, req.user);
    } catch (error) {
      Logger.error(error, 'CardController - getShippingPhysicalCard');
      throw new BadRequestException(
        error.message || 'Error getting shipping status',
      );
    }
  }

  @Post('shipping')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async createShippingPhysicalCard(@Req() req?: any) {
    try {
      return await this.cardShippingService.shippingPhysicalCard(req.user);
    } catch (error) {
      Logger.error(error, 'CardController - createShippingPhysicalCard');
      throw new BadRequestException(
        error.message || 'Error creating shipping request',
      );
    }
  }

  @Get('sensitive-info/:cardId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async getSensitiveInfo(
    @Param('cardId') cardId: string,
    @Res() res,
    @Req() req?: any,
  ) {
    try {
      const html = await this.cardIntegrationService.getSensitiveCardInfo(
        cardId,
        req.user,
      );
      return res
        .setHeader('Content-Type', 'text/html; charset=utf-8')
        .status(200)
        .send(html);
    } catch (error) {
      Logger.error(error, 'CardController - getSensitiveInfo');
      throw new BadRequestException(
        error.message || 'Error getting sensitive information',
      );
    }
  }

  @Delete(':cardId')
  deleteOneById(@Param('cardId') cardId: string) {
    throw new UnauthorizedException();
  }

  @Get('pomelo/check')
  async checkCardsInPomelo() {
    return {
      statusCode: 200,
      message: 'Started checking cards in Pomelo',
    };
  }
}
