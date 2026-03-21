import { Controller, Post, Body, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

class CreateIntentDto {
  bookingId: string;
  amount: number;
  currency?: string;
}

@ApiTags('Pagos')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @ApiOperation({ summary: 'Crear PaymentIntent de Stripe' })
  createIntent(@Body() dto: CreateIntentDto) {
    return this.paymentsService.createPaymentIntent(dto.bookingId, dto.amount, dto.currency);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook de Stripe (no llamar manualmente)' })
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }
}
