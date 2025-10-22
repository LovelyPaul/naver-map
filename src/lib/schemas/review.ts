// Review Validation Schemas
// 리뷰 관련 Zod 스키마

import { z } from 'zod';

/**
 * 리뷰 작성 스키마
 * placeId는 UUID(DB 장소) 또는 네이버 URL(신규 장소) 모두 허용
 */
export const CreateReviewSchema = z.object({
  placeId: z.string().min(1, '장소 ID가 필요합니다'),
  authorName: z
    .string()
    .min(2, '작성자 이름은 최소 2자 이상이어야 합니다')
    .max(100, '작성자 이름은 최대 100자까지 가능합니다')
    .trim(),
  authorEmail: z
    .string()
    .email('올바른 이메일 형식이 아닙니다')
    .optional()
    .or(z.literal('')),
  rating: z
    .number()
    .int('평점은 정수여야 합니다')
    .min(1, '평점은 최소 1점입니다')
    .max(5, '평점은 최대 5점입니다'),
  content: z
    .string()
    .min(1, '리뷰 내용을 입력해주세요')
    .max(500, '리뷰 내용은 최대 500자까지 입력 가능합니다')
    .trim(),
  password: z
    .string()
    .min(4, '비밀번호는 최소 4자 이상이어야 합니다'),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

/**
 * 리뷰 수정 스키마
 */
export const UpdateReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional(),
  content: z
    .string()
    .min(1)
    .max(500)
    .trim()
    .optional(),
  password: z.string().min(4, '비밀번호를 입력해주세요'),
});

export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;

/**
 * 리뷰 삭제 스키마
 */
export const DeleteReviewSchema = z.object({
  password: z.string().min(4, '비밀번호를 입력해주세요'),
});

export type DeleteReviewInput = z.infer<typeof DeleteReviewSchema>;

/**
 * 리뷰 목록 조회 쿼리 스키마
 * placeId는 UUID(DB 장소) 또는 네이버 URL(신규 장소) 모두 허용
 */
export const GetReviewsQuerySchema = z.object({
  placeId: z.string().min(1, '장소 ID가 필요합니다'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(20).optional().default(10),
});

export type GetReviewsQuery = z.infer<typeof GetReviewsQuerySchema>;
