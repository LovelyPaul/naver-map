'use client';

// PlaceCard Component
// 장소 정보 카드

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCategory } from '@/lib/utils/category';
import type { PlaceListItem } from '@/types/place';

type PlaceCardProps = {
  place: PlaceListItem;
  onClick?: (place: PlaceListItem) => void;
  className?: string;
};

/**
 * 장소 정보를 표시하는 카드 컴포넌트
 *
 * @param place 장소 정보
 * @param onClick 클릭 핸들러
 * @param className 추가 CSS 클래스
 */
export function PlaceCard({ place, onClick, className = '' }: PlaceCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(place);
    }
  };

  const cardContent = (
    <Card
      className={`hover:shadow-lg transition-shadow cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* 이미지 썸네일 */}
          <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
            {place.photoUrl ? (
              <Image
                src={place.photoUrl}
                alt={place.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
            )}
          </div>

          {/* 장소 정보 */}
          <div className="flex-1 min-w-0">
            {/* 장소명 */}
            <h3 className="text-base font-semibold text-gray-900 truncate mb-1">
              {place.name}
            </h3>

            {/* 카테고리 */}
            <div className="mb-2">
              <Badge variant="secondary" className="text-xs">
                {formatCategory(place.categoryMain, place.categorySub)}
              </Badge>
            </div>

            {/* 주소 */}
            <p className="text-sm text-gray-600 truncate mb-1">{place.address}</p>

            {/* 리뷰 통계 */}
            {place.hasReviews && place.reviewCount !== undefined && place.avgRating !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center text-yellow-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="ml-1 font-medium">{place.avgRating.toFixed(1)}</span>
                </div>
                <span className="text-gray-500">리뷰 {place.reviewCount}개</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // 장소 상세 페이지로 링크 (hasReviews가 true인 경우만)
  if (place.hasReviews) {
    return (
      <Link href={`/places/${place.id}`} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
