import { IsUUID, IsInt, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AttachmentDto } from 'src/attachment/dto/attachments.dto';

export class SendMessageDto {
  @IsUUID()
  senderId: string;

  @IsInt()
  conversationId: number;

  @IsOptional()
  @IsString()
  msg?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
