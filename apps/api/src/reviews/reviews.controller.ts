import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { TrustService } from '../trust/trust.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { CreateRenterReviewDto, CreateReviewDto, ReplyReviewDto } from './dto/reviews.dto';
import { Get } from '@nestjs/common';

@Controller({ path: '', version: '1' })
@ApiTags('Reviews')
export class ReviewsController {
  constructor(
    private readonly reviews: ReviewsService,
    private readonly trust: TrustService,
  ) {}

  @Post('properties/:id/reviews')
  @ApiOperation({ summary: 'Post a resident review (gated by 30-day tenancy). Moves trust.' })
  create(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: CreateReviewDto) {
    return this.reviews.create(id, me.id, me.name, dto);
  }

  @Post('reviews/:id/helpful')
  @ApiOperation({ summary: 'Toggle a helpful vote on a review' })
  helpful(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    return this.reviews.toggleHelpful(id, me.id);
  }

  @Post('reviews/:id/reply')
  @ApiOperation({ summary: 'Owner replies to a review' })
  reply(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() dto: ReplyReviewDto) {
    return this.reviews.reply(id, me.id, dto);
  }

  @Get('properties/:id/review-meta')
  @ApiOperation({ summary: 'My review eligibility + helpful-votes for this listing' })
  reviewMeta(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    return this.reviews.reviewMeta(id, me.id);
  }

  @Post('users/:renterId/reviews')
  @ApiOperation({ summary: 'Owner reviews a renter (two-sided trust). Moves reputation.' })
  reviewRenter(@CurrentUser() me: AuthUser, @Param('renterId') renterId: string, @Body() dto: CreateRenterReviewDto) {
    return this.reviews.createRenterReview(me.id, renterId, dto);
  }

  @Public()
  @Get('properties/:id/trust')
  @ApiOperation({ summary: 'Computed trust breakdown for a listing' })
  breakdown(@Param('id') id: string) {
    return this.trust.listingBreakdown(id);
  }
}
