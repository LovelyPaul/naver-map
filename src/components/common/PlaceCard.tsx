'use client';

// PlaceCard Component
// 장소 정보 카드

import Link from 'next/link';
import Image from 'next/image';
import { Edit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCategory } from '@/lib/utils/category';
import type { PlaceListItem } from '@/types/place';

type PlaceCardProps = {
  place: PlaceListItem;
  onClick?: (place: PlaceListItem) => void;
  /** 리뷰 작성 버튼 표시 여부 */
  showReviewButton?: boolean;
  className?: string;
};

/**
 * 카테고리별 placeholder 이미지 URL 생성
 * picsum.photos를 사용하여 카테고리에 맞는 이미지 제공
 */
function getCategoryPlaceholderImage(categoryMain: string): string {
  const categoryImages: Record<string, string> = {
    '음식점': 'https://picsum.photos/seed/food/200/200',
    '카페': 'https://picsum.photos/seed/cafe/200/200',
    '디저트': 'https://picsum.photos/seed/dessert/200/200',
    '베이커리': 'https://picsum.photos/seed/bakery/200/200',
    '술집': 'https://picsum.photos/seed/bar/200/200',
    '한식': 'https://picsum.photos/seed/korean/200/200',
    '중식': 'https://picsum.photos/seed/chinese/200/200',
    '일식': 'https://picsum.photos/seed/japanese/200/200',
    '양식': 'https://picsum.photos/seed/western/200/200',
  };

  return categoryImages[categoryMain] || 'https://picsum.photos/seed/restaurant/200/200';
}

/**
 * 장소 정보를 표시하는 카드 컴포넌트
 *
 * @param place 장소 정보
 * @param onClick 클릭 핸들러
 * @param showReviewButton 리뷰 작성 버튼 표시 여부
 * @param className 추가 CSS 클래스
 */
export function PlaceCard({ place, onClick, showReviewButton = false, className = '' }: PlaceCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(place);
    }
  };

  // 이미지 URL 결정: photoUrl이 있으면 사용, 없으면 카테고리별 placeholder
  const imageUrl = place.photoUrl || getCategoryPlaceholderImage(place.categoryMain);

  const cardContent = (
    <Card
      className={`hover:shadow-lg transition-shadow cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* 이미지 썸네일 */}
          <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
            <Image
              src={imageUrl}
              alt={place.name}
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          </div>

          {/* 장소 정보 */}
          <div className="flex-1 min-w-0">
            {/* 장소명 */}
            {showReviewButton ? (
              <Link
                href={`/places/${encodeURIComponent(place.id)}?${new URLSearchParams({
                  name: place.name,
                  address: place.address,
                  categoryMain: place.categoryMain,
                  ...(place.categorySub && { categorySub: place.categorySub }),
                }).toString()}`}
                className="text-base font-semibold text-gray-900 hover:text-blue-600 truncate mb-1 block"
              >
                {place.name}
              </Link>
            ) : (
              <h3 className="text-base font-semibold text-gray-900 truncate mb-1">
                {place.name}
              </h3>
            )}

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

        {/* 리뷰 작성 버튼 */}
        {showReviewButton && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <Link
              href={`/reviews/write?${new URLSearchParams({
                placeId: place.id,
                placeName: place.name,
                address: place.address,
                categoryMain: place.categoryMain,
                ...(place.categorySub && { categorySub: place.categorySub }),
              }).toString()}`}
            >
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Edit className="w-4 h-4" />
                리뷰 작성
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // 장소 상세 페이지로 링크 (모든 장소)
  // ID가 URL인 경우 인코딩 필요
  const encodedId = encodeURIComponent(place.id);
  // 장소 정보를 URL 파라미터로 전달 (DB에 없는 장소를 위해)
  const queryParams = new URLSearchParams({
    name: place.name,
    address: place.address,
    categoryMain: place.categoryMain,
    ...(place.categorySub && { categorySub: place.categorySub }),
  });

  // 리뷰 작성 버튼이 있는 경우 Link로 감싸지 않음 (버튼 클릭 충돌 방지)
  if (showReviewButton) {
    return cardContent;
  }

  return (
    <Link href={`/places/${encodedId}?${queryParams.toString()}`} className="block">
      {cardContent}
    </Link>
  );
}
