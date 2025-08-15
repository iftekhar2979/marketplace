import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ParticipantsService } from 'src/participants/participants.service';

@Injectable()
export class MessageEligabilityGuard {
  constructor(private readonly participantService: ParticipantsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const params = request.params;

    // Ensure the user is authenticated
    if (!request.user) {
      throw new UnauthorizedException('Unauthorized user!');
    }

    const user = request.user;
    const participants = await this.participantService.getParticipants(params.id);
    let eligable = false;
    let receiver = null;

    for (const participant of participants) {
      if (participant.user.id === user.id) {
        eligable = true;
      } else {
        receiver = participant.user;
      }
    }

    if (!eligable) {
      throw new UnauthorizedException('You are not part of this conversation!');
    }
    request.receiver = receiver;

    return eligable; // Return true if eligible, else false

  }

}
