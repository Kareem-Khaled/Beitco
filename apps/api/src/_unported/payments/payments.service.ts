import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: createFeaturedListingPayment(userId, listingId, durationDays)
  // TODO: handlePaymobWebhook(payload) — verify HMAC + process
  // TODO: getPaymentHistory(userId, cursor)
}
