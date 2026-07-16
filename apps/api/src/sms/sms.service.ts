import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  // Stub: no real SMS provider is wired up yet (ADR-0001 lists Kavenegar,
  // Melipayamak, IPPanel, and SMS.ir as candidates, none chosen/provisioned).
  // Logs instead of sending so the OTP flow can be built and tested end to
  // end now; swap the body of this method for a real provider call later.
  send(phone: string, message: string): void {
    this.logger.log(`[stub SMS] to ${phone}: ${message}`);
  }
}
