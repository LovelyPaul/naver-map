'use client';

// RatingStars Component
// 평점 별 표시 및 입력

import { useState } from 'react';
import { cn } from '@/lib/utils';

type RatingStarsProps = {
  /** 현재 평점 (1-5) */
  rating: number;
  /** 클릭 가능 여부 (입력 모드) */
  interactive?: boolean;
  /** 평점 변경 핸들러 */
  onChange?: (rating: number) => void;
  /** 별 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 추가 CSS 클래스 */
  className?: string;
};

/**
 * 평점 별 표시 및 입력 컴포넌트
 *
 * @param rating 현재 평점 (0-5)
 * @param interactive 클릭 가능 여부
 * @param onChange 평점 변경 핸들러
 * @param size 별 크기 (sm, md, lg)
 * @param className 추가 CSS 클래스
 */
export function RatingStars({
  rating,
  interactive = false,
  onChange,
  size = 'md',
  className = '',
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  // 별 크기 설정
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const sizeClass = sizeClasses[size];

  // 별 클릭 핸들러
  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  // 마우스 오버 핸들러
  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  // 마우스 리브 핸들러
  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  // 표시할 평점 (호버 중이면 호버 평점, 아니면 실제 평점)
  const displayRating = hoverRating || rating;

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      onMouseLeave={handleMouseLeave}
      role={interactive ? 'radiogroup' : undefined}
      aria-label={interactive ? '평점 선택' : `평점 ${rating}점`}
    >
      {[1, 2, 3, 4, 5].map((value) => {
        const isFilled = value <= displayRating;
        const isHalf = !isFilled && value - 0.5 <= displayRating;

        return (
          <button
            key={value}
            type="button"
            className={cn(
              'transition-transform',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            disabled={!interactive}
            role={interactive ? 'radio' : undefined}
            aria-checked={interactive ? value === rating : undefined}
            aria-label={interactive ? `${value}점` : undefined}
          >
            {isFilled ? (
              // 채워진 별
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className={cn(sizeClass, 'text-yellow-400')}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ) : isHalf ? (
              // 반 채워진 별
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className={cn(sizeClass)}
              >
                <defs>
                  <linearGradient id={`half-${value}`}>
                    <stop offset="50%" stopColor="currentColor" className="text-yellow-400" />
                    <stop offset="50%" stopColor="currentColor" className="text-gray-300" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill={`url(#half-${value})`}
                />
              </svg>
            ) : (
              // 빈 별
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className={cn(sizeClass, 'text-gray-300')}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 평점과 리뷰 개수를 함께 표시하는 컴포넌트
 *
 * @param rating 평점
 * @param reviewCount 리뷰 개수
 * @param size 별 크기
 * @param className 추가 CSS 클래스
 */
export function RatingWithCount({
  rating,
  reviewCount,
  size = 'md',
  className = '',
}: {
  rating: number;
  reviewCount: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <RatingStars rating={rating} size={size} />
      <span className={cn('font-medium text-gray-700', textSizeClasses[size])}>
        {rating.toFixed(1)}
      </span>
      <span className={cn('text-gray-500', textSizeClasses[size])}>
        ({reviewCount.toLocaleString()})
      </span>
    </div>
  );
}
