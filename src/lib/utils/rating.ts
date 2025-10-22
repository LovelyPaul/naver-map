// Rating Utility Functions
// 평점 관련 유틸리티 함수

import type { Review } from '@/types/review';

/**
 * 리뷰 배열로부터 평균 평점 계산
 *
 * @param reviews 리뷰 배열
 * @returns 평균 평점 (소수점 1자리)
 *
 * @example
 * calculateAverageRating([
 *   { rating: 5, ... },
 *   { rating: 4, ... },
 *   { rating: 5, ... }
 * ]) // 4.7
 */
export function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) {
    return 0;
  }

  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  const average = sum / reviews.length;

  return Math.round(average * 10) / 10;
}

/**
 * 리뷰 배열로부터 평점 분포 계산
 *
 * @param reviews 리뷰 배열
 * @returns 평점별 개수 객체
 *
 * @example
 * getRatingDistribution([...])
 * // { 1: 2, 2: 5, 3: 10, 4: 15, 5: 20 }
 */
export function getRatingDistribution(reviews: Review[]): {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
} {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const review of reviews) {
    const rating = review.rating as 1 | 2 | 3 | 4 | 5;
    if (rating >= 1 && rating <= 5) {
      distribution[rating]++;
    }
  }

  return distribution;
}

/**
 * 평점 분포에서 특정 평점의 비율 계산
 *
 * @param distribution 평점 분포 객체
 * @param rating 조회할 평점 (1-5)
 * @returns 비율 (0-100)
 *
 * @example
 * getRatingPercentage({ 1: 2, 2: 3, 3: 5, 4: 10, 5: 30 }, 5) // 60
 */
export function getRatingPercentage(
  distribution: { 1: number; 2: number; 3: number; 4: number; 5: number },
  rating: 1 | 2 | 3 | 4 | 5
): number {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return 0;
  }

  return Math.round((distribution[rating] / total) * 100);
}

/**
 * 평점을 별 이모지 문자열로 변환
 *
 * @param rating 평점 (1-5)
 * @returns 별 이모지 문자열
 *
 * @example
 * formatRatingStars(3.5) // "★★★☆☆"
 * formatRatingStars(5) // "★★★★★"
 */
export function formatRatingStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    '★'.repeat(fullStars) +
    (hasHalfStar ? '☆' : '') +
    '☆'.repeat(emptyStars)
  );
}

/**
 * 평점 숫자가 유효한지 검증
 *
 * @param rating 평점
 * @returns 유효 여부
 */
export function isValidRating(rating: number): boolean {
  return (
    typeof rating === 'number' &&
    !Number.isNaN(rating) &&
    rating >= 1 &&
    rating <= 5 &&
    Number.isInteger(rating)
  );
}
