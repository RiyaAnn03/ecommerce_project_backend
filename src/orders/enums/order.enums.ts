import { registerEnumType } from '@nestjs/graphql';
import {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';

registerEnumType(OrderStatus, { name: 'OrderStatus' });
registerEnumType(DeliveryMethod, { name: 'DeliveryMethod' });
registerEnumType(PaymentMethod, { name: 'PaymentMethod' });
registerEnumType(PaymentStatus, { name: 'PaymentStatus' });

export { DeliveryMethod, OrderStatus, PaymentMethod, PaymentStatus };
