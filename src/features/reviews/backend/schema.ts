// Reviews Backend API Schemas

import { z } from 'zod';
import {
  CreateReviewSchema,
  UpdateReviewSchema,
  DeleteReviewSchema,
  GetReviewsQuerySchema,
} from '@/lib/schemas/review';

export {
  CreateReviewSchema,
  UpdateReviewSchema,
  DeleteReviewSchema,
  GetReviewsQuerySchema,
};

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;
export type DeleteReviewInput = z.infer<typeof DeleteReviewSchema>;
export type GetReviewsQuery = z.infer<typeof GetReviewsQuerySchema>;

/**
 * 리뷰 ID 파라미터
 */
export const ReviewIdParamSchema = z.object({
  reviewId: z.string().uuid(),
});

export type ReviewIdParam = z.infer<typeof ReviewIdParamSchema>;
