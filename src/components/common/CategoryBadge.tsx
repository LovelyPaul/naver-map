'use client';

// CategoryBadge Component
// 카테고리 배지

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type CategoryBadgeProps = {
  /** 메인 카테고리 */
  main: string;
  /** 서브 카테고리 (옵션) */
  sub?: string | null;
  /** 배지 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 배지 스타일 */
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  /** 추가 CSS 클래스 */
  className?: string;
};

/**
 * 카테고리 배지 컴포넌트
 *
 * @param main 메인 카테고리
 * @param sub 서브 카테고리
 * @param size 크기
 * @param variant 스타일 variant
 * @param className 추가 CSS 클래스
 */
export function CategoryBadge({
  main,
  sub,
  size = 'md',
  variant = 'secondary',
  className = '',
}: CategoryBadgeProps) {
  // 크기별 클래스
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  // 표시할 텍스트
  const displayText = sub ? `${main} > ${sub}` : main;

  return (
    <Badge variant={variant} className={cn(sizeClasses[size], className)}>
      {displayText}
    </Badge>
  );
}

/**
 * 카테고리 목록 배지
 * 메인과 서브를 분리하여 표시
 */
export function CategoryBadgeList({
  main,
  sub,
  size = 'md',
  className = '',
}: Omit<CategoryBadgeProps, 'variant'>) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Badge variant="default" className={sizeClasses[size]}>
        {main}
      </Badge>
      {sub && (
        <>
          <span className="text-gray-400">›</span>
          <Badge variant="outline" className={sizeClasses[size]}>
            {sub}
          </Badge>
        </>
      )}
    </div>
  );
}
