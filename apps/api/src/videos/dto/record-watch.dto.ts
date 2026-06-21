import { IsBoolean, IsInt, Min } from 'class-validator';

export class RecordWatchDto {
  @IsInt()
  @Min(0)
  watchedSeconds!: number;

  @IsInt()
  @Min(1)
  totalSeconds!: number;

  @IsBoolean()
  completed!: boolean;
}
