// Reviews DTO
// 백엔드 스키마 재노출

import { z } from 'zod';

/**
 * 리뷰 목록 조회 응답 스키마
 */
export const GetReviewsResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      placeId: z.string(),
      authorName: z.string(),
      authorEmail: z.string().nullable(),
      rating: z.number(),
      content: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
  ),
  pagination: z.object({
    currentPage: z.number(),
    pageSize: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
  }),
});

export type GetReviewsResponse = z.infer<typeof GetReviewsResponseSchema>;
