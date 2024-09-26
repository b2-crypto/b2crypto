export class RequestMetadataDto {
  ts: string;
  method: string;
  url: string;
  data: any;

  public toString(): any {
    return (
      this.ts ??
      '' + this.method?.toUpperCase() ??
      '' + this.url?.toString() ??
      '' + this.data ??
      null
    );
  }
}
