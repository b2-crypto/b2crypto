import { Traceable } from '@amplication/opentelemetry-nestjs';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import { PomeloEnum } from '@integration/integration/enum/pomelo.enum';
import {
  BadRequestException,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import { SchedulerRegistry } from '@nestjs/schedule';
import * as bcrypt from 'bcrypt';
import { isDateString, isEmail, isPhoneNumber } from 'class-validator';
import * as http from 'http';
import { CountryCode } from 'libphonenumber-js';
import { FetchData } from './models/fetch-data.model';
import { QuerySearchAnyDto } from './models/query_search-any.dto';

@Traceable()
@Injectable()
export class CommonService {
  static getOTP() {
    return CommonService.getNumberDigits(
      CommonService.randomIntNumber(999999),
      6,
    );
  }
  static getNumberDigits(number: number, digitsExpected = 2) {
    return number.toString().padStart(digitsExpected, '0');
  }
  static async checkSearchText(
    service,
    builder,
    updateEventName: string,
    updateEventFunction: string,
    properties: string[],
    query: QuerySearchAnyDto = {},
    withRta = false,
  ) {
    query.relations = properties;
    query.page = 1;
    let rta;
    do {
      const elems = await service.findAll(query);
      elems.list = elems.list.map((item) => {
        item.searchText = service.getSearchText(item);
        builder[updateEventFunction](updateEventName, {
          id: item._id,
          searchText: item.searchText,
        });
        console.debug(
          `${item.numericId} - ${item.leadEmail}`,
          `Updated searchText page ${elems.currentPage} / ${elems.lastPage}`,
        );
        return item;
      });
      query.page = elems.nextPage;
      if (withRta) {
        if (!rta) {
          rta = elems;
        } else {
          rta.list = rta.list.concat(elems.list);
        }
      }
    } while (query.page != 1);
    if (withRta) {
      return rta;
    }
  }

  static async getTimeToFunction<Trta = any>(
    func,
    functionName = '------',
    onlyTimeLapse = false,
  ): Promise<Trta> {
    if (typeof func !== 'function') {
      throw new BadRequestException('Func must be a function');
    }
    const start = new Date();
    try {
      const rta = await func();
      const end = new Date();
      if (!onlyTimeLapse) {
        console.log(`${functionName} start: ${start.toISOString()}`);
        console.log(
          `${functionName} end: ${end.toISOString()}`,
          'Time to function',
        );
      }
      console.log(
        `${functionName} Timed lapsed (ms): ${end.getTime() - start.getTime()}`,
        'Time to function',
      );
      return rta;
    } catch (error) {
      const end = new Date();
      console.log(`${functionName} start: ${start.toISOString()}`);
      console.log(
        `${functionName} end: ${end.toISOString()}`,
        'Time to function',
      );
      console.log(
        `${functionName} Timed lapsed (ms): ${end.getTime() - start.getTime()}`,
        'Time to function',
      );
      throw error;
    }
  }
  static patternPassword =
    /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;

  static generatePassword(size = 8): string {
    return Math.random()
      .toString(36)
      .slice(size * -1);
  }

  static validateEmail(email: string) {
    return isEmail(email);
  }

  static randomIntNumber(max: number) {
    return parseInt((Math.random() * max + 1).toString());
  }

  static validatePhoneNumber(phoneNumber: string, region?: CountryCodeEnum) {
    if (!region || !region?.length) {
      return isPhoneNumber(phoneNumber);
    }
    return isPhoneNumber(phoneNumber, region as CountryCode);
  }

  static getHash(password: string, salt = 10) {
    return bcrypt.hashSync(password, salt);
  }

  static getSeparatorSearchText(): string {
    return '_|_';
  }
  static escapeStringRegex(str: string) {
    return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
  }

  static getDateTime(date: Date, utc = true) {
    return (
      CommonService.getDate(date, utc) + ' ' + CommonService.getTime(date, utc)
    );
  }

  static getDate(date: Date, utc = true) {
    return `${
      utc ? date.getUTCFullYear() : date.getFullYear()
    }/${CommonService.getNumberDigits(
      (utc ? date.getUTCMonth() : date.getMonth()) + 1,
    )}/${CommonService.getNumberDigits(
      utc ? date.getUTCDate() : date.getDate(),
    )}`;
  }

  static getTime(date: Date, utc = true) {
    return `${CommonService.getNumberDigits(
      utc ? date.getUTCHours() : date.getHours(),
    )}:${CommonService.getNumberDigits(
      utc ? date.getUTCMinutes() : date.getMinutes(),
    )}:${CommonService.getNumberDigits(
      utc ? date.getUTCSeconds() : date.getSeconds(),
    )}`;
  }

  static getDateFromOutside(
    dateValue: string,
    start = null,
    utc = false,
  ): Date {
    if (!isDateString(dateValue)) {
      throw new BadRequestException('Bad format date');
    }
    const date = new Date(dateValue);
    if (start !== null) {
      // TODO[hender - 2024/02/22] Adjust to GMT-6
      const offset = new Date().getTimezoneOffset() / 60;
      if (date.getHours() >= 24 - offset) {
        date.setHours(date.getHours() + offset);
      }
      if (start) {
        if (utc) {
          date.setUTCHours(0, 0, 0, 0);
        } else {
          date.setHours(0, 0, 0, 0);
        }
      } else {
        if (utc) {
          date.setUTCHours(23, 59, 59, 999);
        } else {
          date.setHours(23, 59, 59, 999);
        }
      }
    }
    return date;
  }

  static getSlug(str: string) {
    return str
      .toString()
      .normalize('NFD') // split an accented letter in the base letter and the acent
      .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 ]/g, '') // remove all chars not letters, numbers and spaces (to be replaced)
      .replace(/\s+/g, '-');
  }

  static addTimeout(
    schedulerRegistry: SchedulerRegistry,
    name: string,
    milliseconds: number,
    callback: any,
  ) {
    if (typeof callback !== 'function') {
      throw new BadRequestException('The callback must be a function');
    }
    const timeout = setTimeout(callback, milliseconds);
    schedulerRegistry.addTimeout(name, timeout);
  }

  static removeTimeout(schedulerRegistry: SchedulerRegistry, name: string) {
    try {
      const task = schedulerRegistry.getTimeout(name);
      clearTimeout(task);
      schedulerRegistry.deleteTimeout(name);
      console.log('cleared', `Task "${name}" schedulerRegistry`);
    } catch (err) {
      console.error(err, `Task "${name}" schedulerRegistry`);
    }
  }

  static ack(ctx: RmqContext) {
    if (!!ctx) {
      const channel = ctx.getChannelRef();
      const originalMessage = ctx.getMessage();
      channel.ack(originalMessage);
    }
  }
  static cleanString(str: string) {
    return str
      .replace(/[+*\n]|^\d+|\"|\,/g, ' ')
      .replace(/[ ]{2,}/g, ' ')
      .trim();
  }

  static checkDateAttr(attrVal: any, utc = false) {
    if (attrVal['start'] || attrVal['end']) {
      // Is range
      let greater = attrVal['doNotInclude'] ? '$gt' : '$gte';
      let smaller = attrVal['doNotInclude'] ? '$lt' : '$lte';
      const range = {};
      if (isDateString(attrVal['start'])) {
        if (!isDateString(attrVal['end'])) {
          greater = '$gt';
        }
        range[greater] = CommonService.getDateFromOutside(
          attrVal['start'],
          true,
          utc,
        );
      }
      if (isDateString(attrVal['end'])) {
        if (!isDateString(attrVal['start'])) {
          smaller = '$lt';
        }
        range[smaller] = CommonService.getDateFromOutside(
          attrVal['end'],
          false,
          utc,
        );
      }
      attrVal = {};
      if (range[greater]) {
        attrVal[greater] = range[greater];
      }
      if (range[smaller]) {
        attrVal[smaller] = range[smaller];
      }
    }
    //console.log(attrVal, 'End date checkDateAttr');
    return attrVal;
  }

  static async fetch(fetchData: FetchData) {
    fetchData.method = fetchData.method ?? 'GET';
    fetchData.headers = fetchData.headers ?? {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    const request = {
      method: fetchData.method,
      headers: fetchData.headers,
      body: undefined,
      signal: fetchData.signal,
    };
    if (fetchData.data) {
      if (
        request.method === 'POST' ||
        request.method === 'PUT' ||
        request.method === 'PATCH'
      ) {
        request.body = JSON.stringify(fetchData.data);
      } else {
        const queryParams = new URLSearchParams();
        Object.entries(fetchData.data).forEach(([key, val]) => {
          queryParams.append(
            fetchData.getFormatKey.replace('%key%', key.toString()),
            val.toString(),
          );
        });
        fetchData.uri += `?${queryParams.toString()}`;
      }
    }
    if (fetchData.token) {
      request.headers.Authorization = `Bearer ${fetchData.token}`;
    }

    return fetch(`${fetchData.urlBase}${fetchData.uri}`, request)
      .then((res) => res.json())
      .catch((error) => {
        throw new InternalServerErrorException(error);
      });
  }

  static async getNextOpenPort(startFrom = 3000): Promise<number> {
    let openPort = null;
    try {
      while (startFrom < 65535 || !!openPort) {
        if (await CommonService.isPortOpen(startFrom)) {
          openPort = startFrom;
          break;
        }
        startFrom++;
      }
      return openPort;
    } catch (err) {
      console.error(err);
    }
  }

  static async isPortOpen(port) {
    return new Promise((resolve, reject) => {
      try {
        const s = http.createServer();
        s.once('error', (err) => {
          s.close();
          resolve(err['code'] == 'EADDRINUSE');
        });
        s.once('listening', () => {
          s.close();
          resolve(true);
        });
        s.listen(port);
      } catch (err) {
        reject(err);
      }
    });
  }
  static getUserId(req?: any) {
    const userId = req?.user?.id;
    if (userId) {
      return userId;
    }
    throw new BadRequestException('User not found');
  }
  static getQueryWithUserId(
    query?: QuerySearchAnyDto,
    req?: any,
    attrName = 'user',
  ) {
    const userId = CommonService.getUserId(req);
    query = query ?? {};
    query.where = query.where ?? {};
    query.where[attrName] = userId;
    //ANCHOR - Descomentar para activar el filtro de showToOwner
    // query.where.showToOwner = isBoolean(query.where.showToOwner)
    //   ? query.where.showToOwner
    //   : true;
    return query;
  }
  static checkWhitelistedIps(context: ExecutionContext): boolean {
    console.debug('Check whitelisted ips', 'checkWhitelistedIps');
    if (
      process.env.POMELO_WHITELISTED_IPS_CHECK ===
      PomeloEnum.POMELO_WHITELISTED_IPS_CHECK_OFF.toString()
    ) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const caller =
      request?.headers[PomeloEnum.POMELO_WHITELISTED_HEADER_FORWARDED] ||
      request?.headers[PomeloEnum.POMELO_WHITELISTED_HEADER_REAL] ||
      '';
    console.log(`IpCaller: ${caller}`, 'SignatureGuard');
    const whitelisted = process.env.POMELO_WHITELISTED_IPS;
    return (
      whitelisted?.replace(/\s/g, '')?.split(',')?.includes(caller) || false
    );
  }
}
