'use client';

// PlaceInfoHeader Component
// 장소 상세 정보 헤더

import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCategory } from '@/lib/utils/category';

/**
 * PlaceInfoHeader Props
 */
type PlaceInfoHeaderProps = {
  name: string;
  categoryMain: string;
  categorySub: string | null;
  address: string;
  backHref?: string;
};

/**
 * 장소 상세 정보 헤더 컴포넌트
 *
 * @example
 * ```tsx
 * <PlaceInfoHeader
 *   name="스타벅스 강남점"
 *   categoryMain="음식점"
 *   categorySub="카페"
 *   address="서울시 강남구..."
 * />
 * ```
 */
export function PlaceInfoHeader({
  name,
  categoryMain,
  categorySub,
  address,
  backHref = '/map',
}: PlaceInfoHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 뒤로 가기 버튼 */}
        <Link href={backHref} className="inline-block mb-4">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            뒤로
          </Button>
        </Link>

        {/* 장소 이름 */}
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
          {name}
        </h1>

        {/* 카테고리 */}
        <div className="mb-4">
          <Badge variant="secondary" className="text-sm">
            {formatCategory(categoryMain, categorySub)}
          </Badge>
        </div>

        {/* 주소 */}
        <div className="flex items-start gap-2 text-slate-600">
          <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{address}</p>
        </div>
      </div>
    </div>
  );
}
