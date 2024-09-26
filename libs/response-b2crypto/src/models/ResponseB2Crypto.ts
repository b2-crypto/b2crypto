import ActionsEnum from '@common/common/enums/ActionEnum';
import { BadRequestException } from '@nestjs/common';
import { ApiResponseOptions } from '@nestjs/swagger';
import { isArray } from 'class-validator';
import { MessageResponseB2Crypto } from './MessageResponseB2Crypto';
import { MessageResponseDto } from './dto/message.response.dto';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';

// TODO[hender] Check response in many action case (ManyCreate, ManyUpdate, ManyDelete)
class ResponseB2Crypto {
  constructor(
    private env: string,
    private data: any,
    private action?: ActionsEnum,
    private code?: number,
    private message?: string,
    private description?: string,
    private page?: any,
  ) {
    if (data.response) {
      data = {
        ...data.response,
        message: data.message ?? data.response.message,
        status: data.status ?? data.response.status,
      };
    }
    if (data.response) {
      data = {
        ...data.response,
        message: data.message ?? data.response.message,
        statusCode: data.statusCode ?? data.response.statusCode,
      };
    }
    if (data.response) {
      data = {
        ...data.response,
        message: data.message ?? data.response.message,
        statusCode: data.statusCode ?? data.response.statusCode,
      };
    }
    this.code = code || this.getCode(data);
    this.action = action;
    this.message = message || data?.message;
    this.description = description || data?.description;
    this.data = data?.data;
    if (this.env === EnvironmentEnum.dev) {
      this.data = data;
    } else {
      if (isArray(data) || !!data?.id || data.access_token) {
        // Is list or object or update
        this.data = data;
      }
    }
    if (data.nextPage) {
      this.page = {
        nextPage: data.nextPage,
        prevPage: data.prevPage,
        lastPage: data.lastPage,
        firstPage: data.firstPage,
        currentPage: data.currentPage,
        totalElements: data.totalElements,
        elementsPerPage: data.elementsPerPage,
        order: Array<string>,
      };
      this.data = data.list;
    } else if (data._id || data.id) {
      this.data = data;
    } else if (data.message) {
      this.page = data.page;
      this.data = data.data;
    }
  }

  getCode(data: any): number {
    let code: number = (data?.code ||
      data?.statusCode ||
      data?.status) as number;
    if (!code || code < 200 || code > 504) {
      // TODO[hender] Validate the other error to return HTTP statusCode
      code = 500;
      if (
        isArray(data) ||
        data?.id?.hasOwnProperty('_bsontype') ||
        data?.data?.id?.hasOwnProperty('_bsontype')
      ) {
        // Is list or object
        code = 200;
      } else if (!!data?.stack) {
        code = 501;
      } else if (data?.hasOwnProperty('affected')) {
        // Is update
        code = data.affected ? 200 : 400;
      }
    }
    delete this.data?.statusCode;
    return code;
  }

  getResponse(message?: string, description?: string) {
    if (!this.code) {
      // TODO[hender] Check if is no code mean is an error
      this.code = 500;
    }
    message = message ?? this.message;
    if (isArray(this.data)) {
      this.code = 201;
    }
    if (!message && !this.message) {
      message = MessageResponseB2Crypto.getMessageCode(this.code, this.action);
    } else if (!message) {
      message = MessageResponseB2Crypto.getMessageCode(this.code, this.action);
      description = this.getDescription(description);
    }
    return {
      statusCode: this.code,
      message: message,
      description: description || this.description,
      data: this.data?.list ?? this.data,
      page: this.page,
    };
  }

  private getDescription(description): string {
    const desc = this.data?.response?.message || this.message || description;
    if (isArray(desc)) {
      return desc.join(', ');
    }
    return desc;
  }

  getErrorResponse(): BadRequestException {
    const rta = this.getResponse();
    return new BadRequestException(rta, rta.description);
  }

  static getResponseSwagger(code: number, actionName?: ActionsEnum) {
    return {
      status: code,
      type: MessageResponseDto,
      description: MessageResponseB2Crypto.getMessageCode(code, actionName),
    } as ApiResponseOptions;
  }
}

export default ResponseB2Crypto;
