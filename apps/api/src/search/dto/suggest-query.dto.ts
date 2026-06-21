import { IsString, MinLength } from 'class-validator';

export class SuggestQueryDto {
  @IsString()
  @MinLength(1)
  q!: string;
}
