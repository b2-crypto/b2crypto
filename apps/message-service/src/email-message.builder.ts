import TransportEnum from '@common/common/enums/TransportEnum';
import {
    AttachmentsEmailConfig,
    MessageCreateDto,
} from '@message/message/dto/message.create.dto';
import { ScopeDto } from '@permission/permission/dto/scope.dto';

export class EmailMessageBuilder {
  private message: MessageCreateDto;

  constructor() {
    this.message = {
      name: '',
      body: '',
      originText: '',
      destinyText: '',
      transport: TransportEnum.EMAIL,
      destiny: {} as ScopeDto,
      vars: {},
      description: '',
      category: '',
      origin: {} as ScopeDto,
      status: '',
      attachments: [],
      creator: new Date().toISOString(),
    };
  }

  setName(name: string): EmailMessageBuilder {
    this.message.name = name;
    return this;
  }

  setBody(body: string): EmailMessageBuilder {
    this.message.body = body;
    return this;
  }

  setOriginText(originText: string): EmailMessageBuilder {
    this.message.originText = originText;
    return this;
  }

  setDestinyText(destinyText: string): EmailMessageBuilder {
    this.message.destinyText = destinyText;
    return this;
  }

  setTransport(transport: TransportEnum): EmailMessageBuilder {
    this.message.transport = transport;
    return this;
  }

  setDestiny(destiny: ScopeDto): EmailMessageBuilder {
    // Cambiado a ScopeDto
    this.message.destiny = destiny;
    return this;
  }

  setVars(vars: any): EmailMessageBuilder {
    this.message.vars = vars;
    return this;
  }

  setDescription(description: string): EmailMessageBuilder {
    this.message.description = description;
    return this;
  }

  setCategory(category: string): EmailMessageBuilder {
    this.message.category = category;
    return this;
  }

  setOrigin(origin: ScopeDto): EmailMessageBuilder {
    this.message.origin = origin;
    return this;
  }

  setStatus(status: string): EmailMessageBuilder {
    this.message.status = status;
    return this;
  }

  setAttachments(attachments: AttachmentsEmailConfig[]): EmailMessageBuilder {
    this.message.attachments = attachments;
    return this;
  }

  setCreator(creator: string): EmailMessageBuilder {
    this.message.creator = creator;
    return this;
  }

  build(): MessageCreateDto {
    return this.message;
  }
}