import { Base, field, makeModel, schema } from "~/lib/mongoose";

@schema()
class Payment extends Base {
  @field(String)
  type: 'role' | 'message';

  @field(Object)
  data: string;

  @field(String)
  userId: string;

  @field({ type: Number, default: 0 })
  amount: number;

  @field({ type: Date, default: Date.now })
  crated: Date;

  @field({ type: Boolean, default: false })
  isPay: boolean;

  @field({ type: Boolean, default: false })
  isApply: boolean;
}

export class PaymentModel extends makeModel(Payment) {

}