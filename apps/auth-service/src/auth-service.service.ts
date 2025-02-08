import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import ResourcesEnum from '@common/common/enums/ResourceEnum';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PersonCreateDto } from '@person/person/dto/person.create.dto';
import { UserServiceMongooseService } from '@user/user';
import { UserPreRegisterDto } from '@user/user/dto/user.pre.register.dto';
import { UserRegisterDto } from '@user/user/dto/user.register.dto';
import { UserDocument } from '@user/user/entities/mongoose/user.schema';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import EventsNamesMessageEnum from 'apps/message-service/src/enum/events.names.message.enum';
import EventsNamesPersonEnum from 'apps/person-service/src/enum/events.names.person.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Traceable()
@Injectable()
export class AuthService {
  constructor(
    @InjectPinoLogger(AuthService.name)
    protected readonly logger: PinoLogger,
    @Inject(BuildersService)
    private builder: BuildersService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @Inject(UserServiceMongooseService)
    private lib: UserServiceMongooseService,
  ) {}

  async newUser(user: UserRegisterDto) {
    user.slugEmail = CommonService.getSlug(user.email);
    user.username = user.username ?? CommonService.getSlug(user.name);
    user.slugUsername = CommonService.getSlug(user.username);
    user.verifyEmail = true;
    if (!user.level) {
      const level0 = await this.builder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findAll,
        {
          where: {
            slug: 'grupo-0',
          },
        },
      );
      user.level = level0.list[0];
    }
    const userCreated = await this.lib.create(user);
    if (userCreated.level) {
      this.builder.emitUserEventClient(EventsNamesUserEnum.updateLeveluser, {
        user: userCreated._id,
        level: user.level._id,
      });
    }
    return userCreated;
  }

  async newPreRegisterUser(createUserDto: UserPreRegisterDto) {
    createUserDto.name =
      createUserDto.name ??
      createUserDto.username ??
      createUserDto.email.split('@')[0];
    createUserDto.slugEmail = CommonService.getSlug(createUserDto.email);
    createUserDto.username = createUserDto.username ?? createUserDto.name;
    createUserDto.slugUsername = CommonService.getSlug(createUserDto.username);

    const user = await this.builder.getPromiseUserEventClient(
      EventsNamesUserEnum.createOne,
      createUserDto,
    );

    if (!user._id) {
      throw new BadRequestException('User already exists');
    }

    try {
      user.personalData = await this.builder.getPromisePersonEventClient(
        EventsNamesPersonEnum.createOne,
        {
          taxIdentificationValue: '',
          preRegistry: true,
          name: createUserDto.name,
          firstName: createUserDto.name,
          slugName: CommonService.getSlug(createUserDto.name),
          email: createUserDto.email,
          emails: [createUserDto.email],
          phoneNumber: createUserDto.phone,
          user: user._id.toString(),
        } as unknown as PersonCreateDto,
      );

      await this.builder.emitMessageEventClient(
        EventsNamesMessageEnum.sendPreRegisterEmail,
        {
          destinyText: user.email,
          vars: {
            name: user.name,
            email: user.email,
            clientName: createUserDto.description,
          },
        },
      );

      this.builder.emitUserEventClient(EventsNamesUserEnum.updateOne, {
        id: user._id.toString(),
        active: !!createUserDto.active,
      });

      return user;
    } catch (error) {
      await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.deleteOneById,
        user._id.toString(),
      );
      throw new BadRequestException('Person already exists');
    }
  }

  async generateOtp(user: UserDocument, msOTP?: number) {
    if (!msOTP) {
      msOTP = 90 * 1000;
    }
    let otpSended = await this.getOtpGenerated(user.email);
    if (!otpSended) {
      otpSended = CommonService.getOTP();
      await this.cacheManager.set(user.email, otpSended, msOTP);
    }
    const data = {
      destinyText: user.email,
      destiny: null,
      vars: {
        name: user.name ?? user.email,
        lastname: '',
        otp: otpSended,
      },
    };
    if (user._id) {
      data.destiny = {
        resourceId: user._id,
        resourceName: ResourcesEnum.USER,
      };
    }
    this.logger.info(`[generateOtp] OTP Sended: ${JSON.stringify(data)}`);
    this.builder.emitMessageEventClient(
      EventsNamesMessageEnum.sendEmailOtpNotification,
      data,
    );
    return otpSended;
  }

  private async getOtpGenerated(email: string) {
    return this.cacheManager.get(email);
  }

  private async deleteOtpGenerated(email: string) {
    return this.cacheManager.del(email);
  }
}
