export class ResponseCreationAccount {
  _id: string;
  id: string;
  responseAccount: {
    data: {
      id: string;
      type: string;
      attributes: {
        address: string;
      };
    };
  };
}
