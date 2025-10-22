// Reviews Error Codes

export const ReviewErrorCode = {
  REVIEW_NOT_FOUND: 'REVIEW_NOT_FOUND',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  PLACE_NOT_FOUND: 'PLACE_NOT_FOUND',
} as const;

export type ReviewErrorCode = (typeof ReviewErrorCode)[keyof typeof ReviewErrorCode];
