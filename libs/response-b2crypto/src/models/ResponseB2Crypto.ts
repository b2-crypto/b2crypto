import ActionsEnum from '@common/common/enums/ActionEnum';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { ApiResponseOptions } from '@nestjs/swagger';
import { isArray } from 'class-validator';
import { MessageResponseB2Crypto } from './MessageResponseB2Crypto';
import { MessageResponseDto } from './dto/message.response.dto';

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
    this.code = code || this.getCode(data);
    this.action = action;
    this.message = message || data?.message || data?.response?.message;
    this.description =
      description || data?.description || data?.response?.description;
    this.data =
      Array.isArray(data) || !!data?.id || data?.access_token
        ? data
        : data?.data;

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
    const code = data?.code || data?.response?.code;
    const statusCodeData = data?.statusCode || data?.response?.statusCode;
    const statusData = data?.status || data?.response?.status;

    if (!code && !statusCodeData && !statusData)
      return HttpStatus.INTERNAL_SERVER_ERROR;

    const statusCode = parseInt(code ?? statusCodeData ?? statusData);

    if (
      isArray(data) ||
      data?.id?.hasOwnProperty('_bsontype') ||
      data?.data?.id?.hasOwnProperty('_bsontype')
    ) {
      return statusCode >= HttpStatus.OK &&
        statusCode <= HttpStatus.PARTIAL_CONTENT
        ? statusCode
        : HttpStatus.OK;
    }

    if (data?.stack) {
      return statusCode >= HttpStatus.INTERNAL_SERVER_ERROR &&
        statusCode <= HttpStatus.HTTP_VERSION_NOT_SUPPORTED
        ? statusCode
        : HttpStatus.INTERNAL_SERVER_ERROR;
    }

    if (data?.hasOwnProperty('affected')) {
      return statusCode >= HttpStatus.OK &&
        statusCode <= HttpStatus.PARTIAL_CONTENT
        ? statusCode
        : HttpStatus.OK;
    }

    return statusCode;
  }

  getResponse(message?: string, description?: string) {
    this.code = this.code ?? HttpStatus.INTERNAL_SERVER_ERROR;

    const _message =
      message ||
      this.message ||
      MessageResponseB2Crypto.getMessageCode(this.code, this.action);

    const _description = description || this.description || _message;

    return {
      statusCode: this.code,
      message: _message,
      description: _description,
      data: this.data?.list ?? this.data,
      page: this.page,
    };
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
