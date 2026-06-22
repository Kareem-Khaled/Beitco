import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serializeUser } from '../auth/auth.serializer';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateMe(userId: string, dto: UpdateMeDto): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.avatar !== undefined) data.avatar = dto.avatar;
    if (dto.notifications !== undefined) data.notificationPrefs = dto.notifications;

    const updated = await this.prisma.user.update({ where: { id: userId }, data });
    return serializeUser(updated);
  }
}
