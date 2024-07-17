export class ProcessHeaderDto {
  public idempotency: string;

  public apiKey: string;

  public signature: string;

  public timestamp: number;

  public endpoint: string;
}
