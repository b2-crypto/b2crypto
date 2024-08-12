import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { CommonService } from '@common/common';
import GenericServiceController from '@common/common/interfaces/controller.generic.interface';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { UpdateAnyDto } from '@common/common/models/update-any.dto';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { PersonCreateDto } from '@person/person/dto/person.create.dto';
import { PersonUpdateDto } from '@person/person/dto/person.update.dto';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { BadRequestError } from 'passport-headerapikey';
import EventsNamesPersonEnum from './enum/events.names.person.enum';
import { PersonServiceService } from './person-service.service';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { AddressSchema } from '@person/person/entities/mongoose/address.schema';
import { SwaggerSteakeyConfigEnum } from 'libs/config/enum/swagger.stakey.config.enum';

@ApiTags('PERSON')
@Controller('persons')
export class PersonServiceController implements GenericServiceController {
  constructor(
    private readonly personService: PersonServiceService,
    @Inject(UserServiceService)
    private readonly userService: UserServiceService,
  ) {}

  @Get('all')
  // @CheckPoliciesAbility(new PolicyHandlerPersonRead())
  async findAll(@Query() query: QuerySearchAnyDto) {
    return this.personService.getAll(query);
  }

  @Get('me')
  @UseGuards(ApiKeyAuthGuard)
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_PROFILE)
  @ApiBearerAuth('bearerToken')
  @ApiSecurity('b2crypto-key')
  // @CheckPoliciesAbility(new PolicyHandlerPersonRead())
  async findAllMe(@Req() req, @Query() query: QuerySearchAnyDto) {
    query = CommonService.getQueryWithUserId(query, req);
    return this.personService.getAll(query);
  }

  @Get(':personID')
  // @CheckPoliciesAbility(new PolicyHandlerPersonRead())
  async findOneById(@Param('personID') id: string) {
    return this.personService.getOne(id);
  }

  @Post()
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_PROFILE)
  @ApiBearerAuth('bearerToken')
  @ApiSecurity('b2crypto-key')
  @UseGuards(ApiKeyAuthGuard)
  // @CheckPoliciesAbility(new PolicyHandlerPersonCreate())
  async createOne(@Body() createPersonDto: PersonCreateDto, @Req() req?) {
    createPersonDto.name = createPersonDto.firstName;
    createPersonDto.nationality =
      createPersonDto.nationality ?? createPersonDto.country;
    createPersonDto.taxIdentificationType =
      createPersonDto.taxIdentificationType ?? createPersonDto.typeDocId;
    createPersonDto.taxIdentificationValue =
      createPersonDto.taxIdentificationValue ??
      parseInt(createPersonDto.numDocId);
    if (!createPersonDto.user) {
      const user = await this.userService.getOne(req.user.id);
      if (!user._id) {
        throw new BadRequestError('User not found');
      }
      if (user.personalData) {
        throw new BadRequestError('User already has personal data');
      }
      createPersonDto.user = user._id;
    } else if (createPersonDto.user !== req.user.id) {
      throw new BadRequestError(
        `Only have create to User user ${req.user.email}`,
      );
    }
    const personalData = await this.personService.newPerson(createPersonDto);
    if (personalData.user) {
      await this.userService.updateUser({
        id: personalData.user._id,
        personalData: personalData._id,
      });
    }
    return personalData;
  }

  @Post('all')
  // @CheckPoliciesAbility(new PolicyHandlerPersonCreate())
  async createMany(
    @Body(new ParseArrayPipe({ items: PersonCreateDto }))
    createPersonsDto: PersonCreateDto[],
  ) {
    return this.personService.newManyPerson(createPersonsDto);
  }

  @Patch()
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_PROFILE)
  @ApiBearerAuth('bearerToken')
  @ApiSecurity('b2crypto-key')
  @UseGuards(ApiKeyAuthGuard)
  // @CheckPoliciesAbility(new PolicyHandlerPersonUpdate())
  async updateOne(@Body() updatePersonDto: PersonUpdateDto, @Req() req?) {
    const user = await this.userService.getOne(req.user.id);
    if (!user._id) {
      throw new BadRequestError('User not found');
    }
    const personalData = await this.personService.getOne(
      user.personalData.toString(),
    );
    if (!personalData) {
      throw new BadRequestError('User not have personal data');
    }
    updatePersonDto.id = personalData._id;
    updatePersonDto.location.address = {
      street_name:
        updatePersonDto.location.address.street_name ??
        personalData.location.address.street_name,
      street_number:
        updatePersonDto.location.address.street_number ??
        personalData.location.address.street_number,
      floor:
        updatePersonDto.location.address.floor ??
        personalData.location.address.floor,
      city:
        updatePersonDto.location.address.city ??
        personalData.location.address.city,
      region:
        updatePersonDto.location.address.region ??
        personalData.location.address.region,
      neighborhood:
        updatePersonDto.location.address.neighborhood ??
        personalData.location.address.neighborhood,
      country:
        updatePersonDto.location.address.country ??
        personalData.location.address.country,
      zip_code:
        updatePersonDto.location.address.zip_code ??
        personalData.location.address.zip_code,
      apartment:
        updatePersonDto.location.address.apartment ??
        personalData.location.address.apartment,
    } as AddressSchema;
    return this.personService.updatePerson(updatePersonDto);
  }

  @Patch('all')
  // @CheckPoliciesAbility(new PolicyHandlerPersonUpdate())
  async updateMany(
    @Body(new ParseArrayPipe({ items: PersonUpdateDto }))
    updatePersonsDto: PersonUpdateDto[],
  ) {
    return this.personService.updateManyPersons(updatePersonsDto);
  }

  @Delete(':personID')
  // @CheckPoliciesAbility(new PolicyHandlerPersonDelete())
  async deleteOneById(@Param('personID') id: string) {
    return this.personService.deletePerson(id);
  }

  @Delete('all')
  // @CheckPoliciesAbility(new PolicyHandlerPersonDelete())
  async deleteManyById(
    @Body(new ParseArrayPipe({ items: PersonUpdateDto }))
    ids: PersonUpdateDto[],
  ) {
    return this.personService.deleteManyPersons(ids.map((person) => person.id));
  }

  @AllowAnon()
  @MessagePattern(EventsNamesPersonEnum.findAll)
  findAllEvent(@Payload() query: QuerySearchAnyDto, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.findAll(query);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesPersonEnum.findOneById)
  findOneByIdEvent(@Payload() id: string, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.findOneById(id);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesPersonEnum.createOne)
  createOneEvent(
    @Payload() createDto: PersonCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    const person = this.createOne(createDto);
    CommonService.ack(ctx);
    return person;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesPersonEnum.createMany)
  createManyEvent(
    @Payload() createsDto: PersonCreateDto[],
    @Ctx() ctx: RmqContext,
  ) {
    const person = this.createMany(createsDto);
    CommonService.ack(ctx);
    return person;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesPersonEnum.updateOne)
  updateOneEvent(
    @Payload() updateDto: PersonUpdateDto,
    @Ctx() ctx: RmqContext,
  ) {
    const person = this.updateOne(updateDto);
    CommonService.ack(ctx);
    return person;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesPersonEnum.updateMany)
  updateManyEvent(
    @Payload() updatesDto: PersonUpdateDto[],
    @Ctx() ctx: RmqContext,
  ) {
    const person = this.updateMany(updatesDto);
    CommonService.ack(ctx);
    return person;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesPersonEnum.deleteMany)
  deleteManyByIdEvent(@Payload() ids: UpdateAnyDto[], @Ctx() ctx: RmqContext) {
    const person = this.deleteManyById(ids);
    CommonService.ack(ctx);
    return person;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesPersonEnum.deleteOneById)
  deleteOneByIdEvent(@Payload() id: string, @Ctx() ctx: RmqContext) {
    const person = this.deleteOneById(id);
    CommonService.ack(ctx);
    return person;
  }
}
