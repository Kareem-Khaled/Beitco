import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  likes?: boolean;

  @IsOptional()
  @IsBoolean()
  comments?: boolean;

  @IsOptional()
  @IsBoolean()
  follows?: boolean;

  @IsOptional()
  @IsBoolean()
  mentions?: boolean;

  @IsOptional()
  @IsBoolean()
  groupActivity?: boolean;

  @IsOptional()
  @IsBoolean()
  postApproval?: boolean;

  @IsOptional()
  @IsBoolean()
  messages?: boolean;

  @IsOptional()
  @IsBoolean()
  system?: boolean;

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;
}
