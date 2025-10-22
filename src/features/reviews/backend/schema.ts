// Reviews Backend API Schemas

import { z } from 'zod';
import {
  CreateReviewSchema,
  DeleteReviewSchema,
  GetReviewsQuerySchema,
} from '@/lib/schemas/review';

export {
  CreateReviewSchema,
  DeleteReviewSchema,
  GetReviewsQuerySchema,
};

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type DeleteReviewInput = z.infer<typeof DeleteReviewSchema>;
export type GetReviewsQuery = z.infer<typeof GetReviewsQuerySchema>;

/**
 * 리뷰 ID 파라미터
 */
export const ReviewIdParamSchema = z.object({
  reviewId: z.string().uuid(),
});

export type ReviewIdParam = z.infer<typeof ReviewIdParamSchema>;
