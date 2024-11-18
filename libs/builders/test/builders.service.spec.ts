import { BuildersService } from '@builder/builders';
import EventClientEnum from '@common/common/enums/EventsNameEnum';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { ClientProxy, ReadPacket } from '@nestjs/microservices';
import { of } from 'rxjs';

class MockClientProxy extends ClientProxy {
  protected dispatchEvent<T = any>(packet: ReadPacket): Promise<T> {
    throw new Error('Method not implemented.');
  }
  protected publish(packet: any, callback: (packet: any) => void): () => void {
    return () => {};
  }

  public connect(): Promise<any> {
    return Promise.resolve({});
  }

  public close(): Promise<any> {
    return Promise.resolve({});
  }

  public emit = jest
    .fn()
    .mockImplementation((pattern: string, data: any) => of(true));
  public send = jest
    .fn()
    .mockImplementation((pattern: string, data: any) => of(true));
}

describe('BuildersService', () => {
  let service: BuildersService;
  let configService: ConfigService;
  let moduleRef: TestingModule;
  let mockConfigGet: jest.Mock;

  const mockEventClient = new MockClientProxy();

  beforeEach(async () => {
    mockConfigGet = jest.fn().mockReturnValue('mock-value');

    moduleRef = await Test.createTestingModule({
      imports: [ResponseB2CryptoModule],
      providers: [
        BuildersService,
        {
          provide: ConfigService,
          useValue: {
            get: mockConfigGet,
          },
        },
        {
          provide: EventClientEnum.SERVICE_NAME,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.ACTIVITY,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.AFFILIATE,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.BRAND,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.LEAD,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.CRM,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.FILE,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.MESSAGE,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.CATEGORY,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.TRAFFIC,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.PERMISSION,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.PERSON,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.PSP,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.PSP_ACCOUNT,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.USER,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.ROLE,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.STATS,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.STATUS,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.TRANSFER,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.GROUP,
          useValue: mockEventClient,
        },
        {
          provide: EventClientEnum.ACCOUNT,
          useValue: mockEventClient,
        },
      ],
    }).compile();

    service = moduleRef.get<BuildersService>(BuildersService);
    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have config service injected', () => {
      expect(configService).toBeDefined();
    });
  });

  describe('Event clients', () => {
    it('should have SERVICE_NAME client properly injected', () => {
      const client = moduleRef.get<ClientProxy>(EventClientEnum.SERVICE_NAME);
      expect(client).toBeDefined();
      expect(client.emit).toBeDefined();
      expect(client.send).toBeDefined();
    });

    it('should have ACTIVITY client properly injected', () => {
      const client = moduleRef.get<ClientProxy>(EventClientEnum.ACTIVITY);
      expect(client).toBeDefined();
      expect(client.emit).toBeDefined();
      expect(client.send).toBeDefined();
    });

    it('should have AFFILIATE client properly injected', () => {
      const client = moduleRef.get<ClientProxy>(EventClientEnum.AFFILIATE);
      expect(client).toBeDefined();
      expect(client.emit).toBeDefined();
      expect(client.send).toBeDefined();
    });
  });

  describe('Event client functionality', () => {
    it('should be able to emit events', async () => {
      const client = moduleRef.get<ClientProxy>(EventClientEnum.SERVICE_NAME);
      await client.emit('test-event', { data: 'test' }).toPromise();
      expect(client.emit).toHaveBeenCalledWith('test-event', { data: 'test' });
    });

    it('should be able to send messages', async () => {
      const client = moduleRef.get<ClientProxy>(EventClientEnum.SERVICE_NAME);
      await client.send('test-pattern', { data: 'test' }).toPromise();
      expect(client.send).toHaveBeenCalledWith('test-pattern', {
        data: 'test',
      });
    });
  });

  describe('Error handling', () => {
    it('should handle emit errors gracefully', async () => {
      const client = moduleRef.get<ClientProxy>(EventClientEnum.SERVICE_NAME);
      jest.spyOn(client, 'emit').mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      try {
        await client.emit('test-event', { data: 'test' }).toPromise();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Test error');
      }
    });

    it('should handle send errors gracefully', async () => {
      const client = moduleRef.get<ClientProxy>(EventClientEnum.SERVICE_NAME);
      jest.spyOn(client, 'send').mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      try {
        await client.send('test-pattern', { data: 'test' }).toPromise();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Test error');
      }
    });
  });
});
