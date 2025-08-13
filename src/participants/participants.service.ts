import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConversationParticipant } from './entities/participants.entity';
import { In, Repository } from 'typeorm';
import { Conversations } from 'src/conversations/entities/conversations.entity';
import { User } from 'src/user/entities/user.entity';
import { Product } from 'src/products/entities/products.entity';

@Injectable()
export class ParticipantsService {

  constructor(
    @InjectRepository(ConversationParticipant)
    private participantRepo: Repository<ConversationParticipant>,
  ) {}

  async add(conversation: Conversations, user: User) {
    const exists = await this.participantRepo.findOne({
      where: { conversation: { id: conversation.id }, user: { id: user.id } },
    });
    if (exists) return exists;

    const participant = this.participantRepo.create({ conversation, user });
    return this.participantRepo.save(participant);
  }

  async addMultiple(conversation: Conversations, users: User[],product:Product) {
    const participants = users.map((user) =>
      this.participantRepo.create({ conversation, user ,product }),
    );
    console.log(participants)
    return this.participantRepo.save(participants);
  }
  async checkChatAlreadyExist(query: { conversation_id?: number, product_id?: number, user_ids?: string[] }) {
    const { conversation_id, product_id, user_ids } = query;

    // Build query conditions dynamically based on available input
    const whereConditions: any = {};
if(product_id){
    whereConditions.product ={
        id: product_id
    }
}
    if (user_ids && user_ids.length > 0) {
        whereConditions.user = { id: In(user_ids) }; // Assuming user_ids is an array
    }

    if (conversation_id) {
        whereConditions.conversation = { id: conversation_id };
    }
    // Perform the query
    const existingParticipants = await this.participantRepo.find({
        where: whereConditions,
        relations: ['user', 'conversation','product'], 
    });

    return existingParticipants;
}


  async getParticipants(conversationId: number): Promise<ConversationParticipant[]> {
    return this.participantRepo.find({
      where: { conversation: { id: conversationId } },
      relations: ['user'],
    });
  }

  async muteParticipant(conversationId: number, userId: string) {
    const participant = await this.participantRepo.findOneOrFail({
      where: { conversation: { id: conversationId }, user: { id: userId } },
    });
    participant.isMuted = true;
    return this.participantRepo.save(participant);
  }


}
