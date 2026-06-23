import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serializeUser } from '../auth/auth.serializer';
import { UpdateMeDto } from './dto/update-me.dto';
import {
  toPrismaProfileData,
  type FrontendProfileInput,
} from '../matching/renter-profile.mapper';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateMe(userId: string, dto: UpdateMeDto): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.avatar !== undefined) data.avatar = dto.avatar;
    if (dto.notifications !== undefined) data.notificationPrefs = dto.notifications;

    // Renter preferences: upsert the RenterProfile row and (when provided) store
    // the renter's own gender on the User. The mapper handles the Arabic<->Latin
    // enum translation in one place.
    if (dto.profile !== undefined) {
      const { profile, userGender } = toPrismaProfileData(
        dto.profile as FrontendProfileInput,
      );
      if (userGender) data.gender = userGender;
      await this.prisma.renterProfile.upsert({
        where: { userId },
        create: { userId, ...(profile as object) },
        update: profile as object,
      });
    }

    if (Object.keys(data).length > 0) {
      await this.prisma.user.update({ where: { id: userId }, data });
    }

    const updated = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    return serializeUser(updated!);
  }
}
