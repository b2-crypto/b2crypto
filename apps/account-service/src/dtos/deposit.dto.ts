
export class DataWalletDepositDto {
    type: string;
    id: string;
  }
  
  export class WalletDepositDto {
    data: DataWalletDepositDto;
  
    constructor() {
      this.data = new DataWalletDepositDto();
    }
  }
  
  export class RelationshipsDepositDto {
    wallet: WalletDepositDto;
  
    constructor() {
      this.wallet = new WalletDepositDto();
    }
  }
  
  export class AttributesDepositDto {
    label: string;
    tracking_id: string;
    target_amount_requested: string;
    confirmations_needed: number;
    callback_url: string;
  }
  
  export class DataCreateDepositDto {
    type: string;
    attributes: AttributesDepositDto;
    relationships: RelationshipsDepositDto;
  
    constructor() {
      this.attributes = new AttributesDepositDto();
      this.relationships = new RelationshipsDepositDto();
    }
  }
  
  export class DepositDto {
    data: DataCreateDepositDto;
  
    constructor() {
      this.data = new DataCreateDepositDto();
    }
  }