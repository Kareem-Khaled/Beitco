import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto';
import { PaginationQueryDto } from '../common/dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Authenticated User Endpoints ──────────────────

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns the authenticated user profile' })
  async getMe(@CurrentUser('id') userId: string) {
    const user = await this.usersService.getMe(userId);
    return { success: true, data: user };
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Returns the updated user profile' })
  @ApiResponse({ status: 409, description: 'Username or email already taken' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const user = await this.usersService.updateProfile(userId, dto);
    return { success: true, data: user };
  }

  @Get('check-username/:username')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if a username is available' })
  @ApiResponse({ status: 200, description: 'Returns availability status' })
  async checkUsername(@Param('username') username: string) {
    const available = await this.usersService.isUsernameAvailable(username);
    return { success: true, data: { available } };
  }

  // ─── Public Profile Endpoints ──────────────────────

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get public user profile by ID' })
  @ApiResponse({ status: 200, description: 'Returns public user profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPublicProfile(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.getPublicProfile(id);
    return { success: true, data: user };
  }

  @Get(':id/posts')
  @Public()
  @ApiOperation({ summary: 'Get user posts (paginated)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of user posts' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPosts(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.usersService.getUserPosts(id, query.cursor, query.limit);
    return { success: true, data: result.items, meta: result.meta };
  }

  @Get(':id/followers')
  @Public()
  @ApiOperation({ summary: 'Get user followers (paginated)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of followers' })
  async getUserFollowers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.usersService.getUserFollowers(id, query.cursor, query.limit);
    return { success: true, data: result.items, meta: result.meta };
  }

  @Get(':id/following')
  @Public()
  @ApiOperation({ summary: 'Get users this user follows (paginated)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of following' })
  async getUserFollowing(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.usersService.getUserFollowing(id, query.cursor, query.limit);
    return { success: true, data: result.items, meta: result.meta };
  }
}
