import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server } from 'http';
import { send } from 'process';
// import mongoose, { Model, ObjectId } from 'mongoose';
import { Socket } from 'socket.io';
import { ConversationsService } from 'src/conversations/conversations.service';
import { MessagesService } from 'src/messages/messages.service';
import { ParticipantsModule } from 'src/participants/participants.module';
import { ParticipantsService } from 'src/participants/participants.service';
import { InjectLogger } from 'src/shared/decorators/logger.decorator';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Logger } from 'winston';
// import {
//   CreateCallEndWithSocket,
//   CreateMessageDtoWithSocket,
// } from 'src/message/dto/createMessage.dto';
// import { Message } from 'src/message/message.schema';
// import { NotificationService } from 'src/notification/notification.service';
// import { ProfileService } from 'src/profile/profile.service';
// import { CreateDetailedNotificationDto } from 'src/notification/dto/notification.dto';
// import { InjectModel } from '@nestjs/mongoose';
// import { Conversation } from 'src/conversation/conversation.schema';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import { Cache } from 'cache-manager';
// import { UserService } from 'src/users/users.service';
// import { FirebaseService } from 'src/firebase/firebase.service';

@Injectable()
export class SocketService {
  public io: Socket;
  public connectedClients: Map<string, Socket> = new Map();
  public connectedUsers: Map<string, { name: string; socketID: string }> =
    new Map();
  private writeInterval: NodeJS.Timeout;
  private readonly swipesCount: Map<string, number> = new Map();
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly conversationService:ConversationsService,
    private readonly messageService:MessagesService,
    private readonly participantService: ParticipantsService,
    @InjectLogger() private readonly logger: Logger
    // @InjectRe(Message.name) private readonly messageModel: Model<Message>,
    // @InjectModel(Conversation.name)
    // private readonly conversationModel: Model<Conversation>,
    // private readonly notificationService: NotificationService,
    // private readonly firebaseService:FirebaseService,
    // @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    // this.writeInterval = setInterval(() => this.flushBufferToDatabase(), 10000);
  }
  afterInit(server: Server) {
    console.log('Socket server initialized');
    server.on('error', (error) => {
      console.error('Socket server error:', error.message);
    });
  }

  async handleConnection(socket: Socket) {
    try {
      const clientId = socket.id;
      const token = socket.handshake.headers.authorization;
    //   console.log(socket.handshake.headers);
      console.log(
        'Connected',socket.id 
      );
      if (!token) {
        throw new UnauthorizedException(
          'You are not authorized to access this resource!',
        );
      }
      const jwt = token.split(' ')[1];
      if (!jwt) {
        throw new UnauthorizedException(
          'You are not authorized to access this resource!',
        );
      }
    //   const payload = this.jwtService.verify(jwt);
      const payload = await this.userService.getUserById(this.jwtService.verify(jwt).id)
      console.warn("Payload",payload)
      if (!payload.firstName) {
        throw new UnauthorizedException(
          'You are not authorized to access this resource!',
        );
      }
      this.connectedUsers.set(payload.id, {
        name: payload.firstName,
        socketID: clientId,
      });
// console.log(this.connectedClients)
      this.connectedClients.set(clientId, socket);
      socket.on('send-message', (data) => {
        this.handleSendMessage(payload, data, socket);
      });
      socket.on('active-status', () => {
        this.userActiveStatus(payload.id, socket);
        // this.userDisconnect(payload.id, socket);
      });
      this.userActiveStatus(payload.id, socket);
    //   this.userDisconnect(payload.id, socket);
      socket.on('seen', (data:{receiver_id:string,conversation_id:number}) => {
        this.handleMessageSeen(payload.id, data.receiver_id,data.conversation_id);
      });
    //   socket.on('call-end', (data) => {
    //     this.handleCallEnd(payload, data, socket);
    //   });
    //   socket.on('swipes', () => {
    //     this.handleSwipesCount(payload, socket);
    //   });
    //   socket.on('disconnect', async () => {
    //     console.warn('disconnected', this.connectedUsers.get(payload.id));
    //     await this.userService.updateUserDateAndTime(payload.id);
    //     this.connectedClients.delete(clientId);
    //     this.connectedUsers.delete(payload.id);
    //     this.userActiveStatus(payload.id, socket);
    //     this.userDisconnect(payload.id, socket);
    //     console.log("Connected User",this.connectedUsers);
    //   });
    } catch (error) {
      // console.log(error)
      console.error('Error handling connection:', error.message);

      socket.disconnect(); // Disconnect the socket if an error occurs
    }
  }
  handleDisconnection(socket: Socket, userId: string): void {
    console.log('Disconnected', socket);
    this.connectedClients.delete(socket.id);
    this.connectedUsers.delete(userId);
  }

   async userActiveStatus(id: string, socket:Socket) {
    let friendsInfo = (await this.participantService.findMyFriends(id)) || [];
    friendsInfo.forEach((friend: User) => {
      if (this.connectedUsers.get(friend.id)) {
        socket.emit('active-users', {
          message: `${friend.firstName} is online now.`,
          isActive: true,
          id: friend.id,
        });
      }
    });
  }
  getSocketByUserId(userId: string): Socket | undefined {
    const socketID = this.connectedUsers.get(userId)?.socketID;
    return socketID ? this.connectedClients.get(socketID) : undefined;
  }

  async handleSendMessage(
    payload: User,
    data: {conversation_id:number,msg:string},
    socket: Socket,
  ): Promise<void> {
    try {
      if (!data.conversation_id || !data.msg || !payload.id) {
        throw new Error('Invalid message data!');
      }
    const conversation_id = data.conversation_id
const {sender,receiver}= await this.participantService.checkEligablity({conversation_id,user_id:payload.id})
if(!sender && !receiver){
throw new BadRequestException("You are not eligable for this chat .")
}
  this.logger.log("Sender Receiver",sender,receiver)

      const receiverSocket = this.getSocketByUserId(receiver.id);
      const senderSocket = this.getSocketByUserId(sender.id);
      console.log("payload",payload)
      if (payload.id === receiver.id) {
        this.getSocketByUserId(sender.id).emit(
          `error`,
          'Message Delivered Failed!! Because Sender and Receiver are same',
        );
      }
            const message = await this.messageService.sendMessage({sender:sender, conversation_id:conversation_id,msg:data.msg})
            if(receiverSocket){
                receiverSocket.emit(`conversation-${data.conversation_id}`,message)
            }
            senderSocket.emit(`conversation-${data.conversation_id}`,message);
            await this.conversationService.updatedConversation({conversation_id,message})
    } catch (error) {
        // console.log(error)
      console.error('Error handling send-message:', error.message);
      socket.emit(`error:${data.conversation_id}`, {
        message: 'Failed to send message.',
      });
    }
  }

    activeSocket(id: string, message: string, payload: any): void {
    const senderSocket = this.getSocketByUserId(id.toString());
    if (senderSocket) {
      senderSocket.emit(message, payload);
    } else {
      console.log('Socket is not active');
    }
  }
  async handleMessageSeen(sender_id: string,receiver_id:string, conversation_id: number) {
    try {
      let lastMessage = await this.messageService.seenMessages({conversation_id})
      this.activeSocket(
        sender_id,
        `seen-${conversation_id}`,
        {
          seen: true,
          seenBy: sender_id,
        },
      );
      this.activeSocket(
        receiver_id,
        `seen-${conversation_id}`,
        {
          seen: true,
          seenBy: receiver_id,
        },
      );
     
    } catch (error) {
      console.log(error);
    }
  }

}
