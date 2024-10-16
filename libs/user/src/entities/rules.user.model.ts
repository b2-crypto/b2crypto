export interface RulesUserModel {
  _id: string;
  name: string;
  description: string;
  valueNumber: number;
  valueText: string;
  rules: [RulesUserModel];
}
