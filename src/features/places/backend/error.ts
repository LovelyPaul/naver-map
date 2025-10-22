// Places Error Codes
// 장소 관련 에러 코드

export const PlaceErrorCode = {
  PLACE_NOT_FOUND: 'PLACE_NOT_FOUND',
  NAVER_API_ERROR: 'NAVER_API_ERROR',
  INVALID_QUERY: 'INVALID_QUERY',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export type PlaceErrorCode = (typeof PlaceErrorCode)[keyof typeof PlaceErrorCode];
