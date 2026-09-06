import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ReviewsService, CreateReviewDto } from './reviews.service';

@ApiTags('Reseñas')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Sin login — usa reviewToken del email
  @Post()
  @Throttle({ default: { limit: 5, ttl: 600000 } })
  @ApiOperation({ summary: 'Enviar reseña con token único (sin login)' })
  create(@Body() dto: CreateReviewDto) {
    return this.reviewsService.create(dto);
  }

  @Get('court/:courtId')
  @ApiOperation({ summary: 'Reseñas de una cancha (público)' })
  findByCourt(@Param('courtId') courtId: string) {
    return this.reviewsService.findByCourt(courtId);
  }
}
