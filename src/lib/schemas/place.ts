// Place Validation Schemas
// 장소 관련 Zod 스키마

import { z } from 'zod';

/**
 * 장소 검색 쿼리 스키마
 */
export const SearchPlacesQuerySchema = z.object({
  query: z
    .string()
    .min(2, '검색어는 최소 2자 이상이어야 합니다')
    .max(100, '검색어는 최대 100자까지 가능합니다'),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().int().optional(),
});

export type SearchPlacesQuery = z.infer<typeof SearchPlacesQuerySchema>;

/**
 * 장소 ID 파라미터 스키마
 */
export const PlaceIdParamSchema = z.object({
  placeId: z.string().uuid('유효하지 않은 장소 ID입니다'),
});

export type PlaceIdParam = z.infer<typeof PlaceIdParamSchema>;

/**
 * 좌표 스키마
 */
export const CoordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type CoordinateInput = z.infer<typeof CoordinateSchema>;
