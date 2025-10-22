// Reviews Routes

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabase, getLogger } from '@/backend/hono/context';
import { success, failure, respond } from '@/backend/http/response';
import {
  CreateReviewSchema,
  DeleteReviewSchema,
  GetReviewsQuerySchema,
  ReviewIdParamSchema,
} from './schema';
import { getReviews, createReview, deleteReview } from './service';
import { ReviewErrorCode } from './error';

const app = new Hono<AppEnv>();

/**
 * GET /api/reviews
 * 리뷰 목록 조회 (페이지네이션)
 */
app.get(
  '/api/reviews',
  zValidator('query', GetReviewsQuerySchema),
  async (c) => {
    const query = c.req.valid('query');
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    try {
      const result = await getReviews(query, supabase, logger);
      return respond(c, success(result));
    } catch (error) {
      logger.error('Get reviews error:', error);
      return respond(
        c,
        failure(500, ReviewErrorCode.DATABASE_ERROR, '리뷰 조회 중 오류가 발생했습니다')
      );
    }
  }
);

/**
 * POST /api/reviews
 * 리뷰 생성
 */
app.post(
  '/api/reviews',
  zValidator('json', CreateReviewSchema),
  async (c) => {
    const input = c.req.valid('json');
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    try {
      const review = await createReview(input, supabase, logger);
      return respond(c, success(review, 201));
    } catch (error) {
      logger.error('Create review error:', error);
      return respond(
        c,
        failure(500, ReviewErrorCode.DATABASE_ERROR, '리뷰 생성 중 오류가 발생했습니다')
      );
    }
  }
);

/**
 * DELETE /api/reviews/:reviewId
 * 리뷰 삭제 (비밀번호 검증)
 */
app.delete(
  '/api/reviews/:reviewId',
  zValidator('param', ReviewIdParamSchema),
  zValidator('json', DeleteReviewSchema),
  async (c) => {
    const { reviewId } = c.req.valid('param');
    const { password } = c.req.valid('json');
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    try {
      const success = await deleteReview(reviewId, password, supabase, logger);

      if (!success) {
        return respond(
          c,
          failure(401, ReviewErrorCode.INVALID_PASSWORD, '비밀번호가 일치하지 않습니다')
        );
      }

      return respond(c, { ok: true, status: 204, data: null });
    } catch (error) {
      logger.error('Delete review error:', error);
      return respond(
        c,
        failure(500, ReviewErrorCode.DATABASE_ERROR, '리뷰 삭제 중 오류가 발생했습니다')
      );
    }
  }
);

export default app;
