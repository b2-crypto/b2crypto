import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Traceable } from '@amplication/opentelemetry-nestjs';
import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { CommonService } from '@common/common';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import GenericServiceController from '@common/common/interfaces/controller.generic.interface';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { UpdateAnyDto } from '@common/common/models/update-any.dto';
import { GroupCreateDto } from '@group/group/dto/group.create.dto';
import { GroupUpdateDto } from '@group/group/dto/group.update.dto';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import EventsNamesGroupEnum from './enum/events.names.group.enum';
import { GroupServiceService } from './group-service.service';

@ApiTags('GROUP')
@Traceable()
@Controller('group')
export class GroupServiceController implements GenericServiceController {
  constructor(private readonly groupService: GroupServiceService) {}

  @Get('all')
  @NoCache()
  // @CheckPoliciesAbility(new PolicyHandlerGroupRead())
  async findAll(@Query() query: QuerySearchAnyDto) {
    return this.groupService.getAll(query);
  }

  @Get(':groupID')
  @NoCache()
  // @CheckPoliciesAbility(new PolicyHandlerGroupRead())
  async findOneById(@Param('groupID') id: string) {
    return this.groupService.getOne(id);
  }

  @Post()
  // @CheckPoliciesAbility(new PolicyHandlerGroupCreate())
  async createOne(@Body() createGroupDto: GroupCreateDto) {
    return this.groupService.newGroup(createGroupDto);
  }

  @Post('all')
  // @CheckPoliciesAbility(new PolicyHandlerGroupCreate())
  async createMany(
    @Body(new ParseArrayPipe({ items: GroupCreateDto }))
    createGroupsDto: GroupCreateDto[],
  ) {
    return this.groupService.newManyGroup(createGroupsDto);
  }

  @Patch()
  // @CheckPoliciesAbility(new PolicyHandlerGroupUpdate())
  async updateOne(@Body() updateGroupDto: GroupUpdateDto) {
    return this.groupService.updateGroup(updateGroupDto);
  }

  @Patch('all')
  // @CheckPoliciesAbility(new PolicyHandlerGroupUpdate())
  async updateMany(
    @Body(new ParseArrayPipe({ items: GroupUpdateDto }))
    updateGroupsDto: GroupUpdateDto[],
  ) {
    return this.groupService.updateManyGroups(updateGroupsDto);
  }

  @Delete(':groupID')
  // @CheckPoliciesAbility(new PolicyHandlerGroupDelete())
  async deleteOneById(@Param('groupID') id: string) {
    return this.groupService.deleteGroup(id);
  }

  @Delete('all')
  // @CheckPoliciesAbility(new PolicyHandlerGroupDelete())
  async deleteManyById(
    @Body(new ParseArrayPipe({ items: GroupUpdateDto }))
    ids: GroupUpdateDto[],
  ) {
    return this.groupService.deleteManyGroups(ids.map((group) => group.id));
  }

  @AllowAnon()
  @MessagePattern(EventsNamesGroupEnum.findAll)
  findAllEvent(@Payload() query: QuerySearchAnyDto, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.findAll(query);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesGroupEnum.findOneById)
  findOneByIdEvent(@Payload() id: string, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.findOneById(id);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesGroupEnum.createOne)
  createOneEvent(@Payload() createDto: GroupCreateDto, @Ctx() ctx: RmqContext) {
    const group = this.createOne(createDto);
    CommonService.ack(ctx);
    return group;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesGroupEnum.createMany)
  createManyEvent(
    @Payload() createsDto: GroupCreateDto[],
    @Ctx() ctx: RmqContext,
  ) {
    const group = this.createMany(createsDto);
    CommonService.ack(ctx);
    return group;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesGroupEnum.updateOne)
  updateOneEvent(@Payload() updateDto: GroupUpdateDto, @Ctx() ctx: RmqContext) {
    const group = this.updateOne(updateDto);
    CommonService.ack(ctx);
    return group;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesGroupEnum.updateMany)
  updateManyEvent(
    @Payload() updatesDto: GroupUpdateDto[],
    @Ctx() ctx: RmqContext,
  ) {
    const group = this.updateMany(updatesDto);
    CommonService.ack(ctx);
    return group;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesGroupEnum.deleteMany)
  deleteManyByIdEvent(@Payload() ids: UpdateAnyDto[], @Ctx() ctx: RmqContext) {
    const group = this.deleteManyById(ids);
    CommonService.ack(ctx);
    return group;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesGroupEnum.deleteOneById)
  deleteOneByIdEvent(@Payload() id: string, @Ctx() ctx: RmqContext) {
    const group = this.deleteOneById(id);
    CommonService.ack(ctx);
    return group;
  }
}
