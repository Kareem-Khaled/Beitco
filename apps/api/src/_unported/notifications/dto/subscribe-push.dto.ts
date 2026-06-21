import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum PushPlatform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

export class SubscribePushDto {
  @IsString()
  fcmToken!: string;

  @IsEnum(PushPlatform)
  platform!: PushPlatform;
}
