import { Body, Controller, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';

@Controller({ path: 'users', version: '1' })
@ApiTags('Users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('me')
  @ApiOperation({ summary: 'Update my own profile (settings)' })
  updateMe(@CurrentUser() me: AuthUser, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(me.id, dto);
  }
}
