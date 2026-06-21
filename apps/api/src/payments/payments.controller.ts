import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // TODO: POST /payments/featured-listing — pay for featured listing
  // TODO: POST /payments/webhook — Paymob webhook
  // TODO: GET /payments/history — user payment history
}
