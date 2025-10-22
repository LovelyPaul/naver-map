'use client';

// CharacterCounter Component
// 텍스트 길이 카운터

import { cn } from '@/lib/utils';

type CharacterCounterProps = {
  /** 현재 텍스트 길이 */
  current: number;
  /** 최대 텍스트 길이 */
  max: number;
  /** 경고 임계값 (이 값을 초과하면 경고 색상 표시) */
  warningThreshold?: number;
  /** 추가 CSS 클래스 */
  className?: string;
};

/**
 * 텍스트 길이 카운터 컴포넌트
 *
 * @param current 현재 텍스트 길이
 * @param max 최대 텍스트 길이
 * @param warningThreshold 경고 임계값 (기본: max의 80%)
 * @param className 추가 CSS 클래스
 */
export function CharacterCounter({
  current,
  max,
  warningThreshold,
  className = '',
}: CharacterCounterProps) {
  // 경고 임계값 기본값 설정 (최대값의 80%)
  const threshold = warningThreshold ?? Math.floor(max * 0.8);

  // 상태에 따른 색상 결정
  const isOverLimit = current > max;
  const isWarning = current >= threshold && !isOverLimit;

  const colorClass = isOverLimit
    ? 'text-red-600 font-semibold'
    : isWarning
      ? 'text-orange-500'
      : 'text-gray-500';

  // 진행률 계산
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <div className={cn('space-y-1', className)}>
      {/* 텍스트 카운터 */}
      <div className="flex items-center justify-between text-sm">
        <span className={colorClass}>
          {current.toLocaleString()} / {max.toLocaleString()}자
        </span>

        {isOverLimit && (
          <span className="text-xs text-red-600">
            {(current - max).toLocaleString()}자 초과
          </span>
        )}
      </div>

      {/* 진행 바 */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-200 ease-out',
            isOverLimit
              ? 'bg-red-500'
              : isWarning
                ? 'bg-orange-400'
                : 'bg-blue-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * 간단한 텍스트 카운터 (진행 바 없음)
 */
export function SimpleCharacterCounter({
  current,
  max,
  className = '',
}: {
  current: number;
  max: number;
  className?: string;
}) {
  const isOverLimit = current > max;

  return (
    <span
      className={cn(
        'text-xs',
        isOverLimit ? 'text-red-600 font-semibold' : 'text-gray-500',
        className
      )}
    >
      {current.toLocaleString()} / {max.toLocaleString()}
    </span>
  );
}
