// Places Service
// 장소 관련 비즈니스 로직

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppLogger } from '@/backend/hono/context';
import { getNaverLocalSearchClient, NaverLocalSearchClient } from '@/backend/external/naver-local-search';
import { parseCategory } from '@/lib/utils/category';
import type { PlaceListItem, PlaceDetail } from '@/types/place';
import type { SearchPlacesQuery } from './schema';
import { PlaceErrorCode } from './error';

/**
 * 네이버 API 결과를 PlaceListItem으로 변환
 */
async function transformNaverResultToPlaceListItem(
  naverResult: any,
  supabase: SupabaseClient
): Promise<PlaceListItem> {
  // HTML 태그 제거
  const name = NaverLocalSearchClient.stripHtmlTags(naverResult.title);
  const address = naverResult.roadAddress || naverResult.address;
  const category = naverResult.category;

  // 카테고리 파싱
  const { main: categoryMain, sub: categorySub } = parseCategory(category);

  // 좌표 변환 (네이버 API는 Katech 좌표계 사용)
  const longitude = parseFloat(naverResult.mapx) / 10000000;
  const latitude = parseFloat(naverResult.mapy) / 10000000;

  // DB에서 해당 장소의 리뷰 정보 조회 (link를 naverPlaceId로 사용)
  const { data: placeData } = await supabase
    .from('places')
    .select('id')
    .eq('naver_place_id', naverResult.link)
    .single();

  let hasReviews = false;
  let reviewCount = 0;
  let avgRating = 0;

  if (placeData) {
    // 리뷰 통계 조회
    const { data: reviewStats } = await supabase
      .from('reviews')
      .select('rating')
      .eq('place_id', placeData.id);

    if (reviewStats && reviewStats.length > 0) {
      hasReviews = true;
      reviewCount = reviewStats.length;
      const sum = reviewStats.reduce((acc, r) => acc + r.rating, 0);
      avgRating = Math.round((sum / reviewCount) * 10) / 10;
    }
  }

  return {
    id: placeData?.id || naverResult.link, // UUID 또는 Naver Place ID
    name,
    address,
    category,
    categoryMain,
    categorySub,
    latitude,
    longitude,
    photoUrl: null, // 네이버 API는 사진 URL을 제공하지 않음
    hasReviews,
    reviewCount: hasReviews ? reviewCount : undefined,
    avgRating: hasReviews ? avgRating : undefined,
  };
}

/**
 * 장소 검색
 */
export async function searchPlaces(
  query: SearchPlacesQuery,
  naverClientId: string,
  naverClientSecret: string,
  supabase: SupabaseClient,
  logger: AppLogger
): Promise<{ items: PlaceListItem[]; total: number }> {
  try {
    // 네이버 Local Search API 호출
    const client = getNaverLocalSearchClient(naverClientId, naverClientSecret);
    const response = await client.search({
      query: query.query,
      display: Math.min(query.limit || 10, 5), // 네이버 API는 최대 5개
    });

    logger.info(`Naver Local Search: query="${query.query}", total=${response.total}`);

    // 결과 변환
    const items = await Promise.all(
      response.items.map((item) => transformNaverResultToPlaceListItem(item, supabase))
    );

    return {
      items,
      total: response.total,
    };
  } catch (error) {
    logger.error('Place search error:', error);
    throw error;
  }
}

/**
 * 장소 상세 조회
 */
export async function getPlaceDetail(
  placeId: string,
  supabase: SupabaseClient,
  logger: AppLogger
): Promise<PlaceDetail | null> {
  try {
    // 장소 기본 정보 조회
    const { data: place, error: placeError } = await supabase
      .from('places')
      .select('*')
      .eq('id', placeId)
      .single();

    if (placeError || !place) {
      logger.warn(`Place not found: ${placeId}`);
      return null;
    }

    // 리뷰 통계 계산
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('place_id', placeId);

    const totalReviews = reviews?.length || 0;
    let averageRating = 0;
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (reviews && reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      averageRating = Math.round((sum / reviews.length) * 10) / 10;

      // 평점 분포 계산
      for (const review of reviews) {
        const rating = review.rating as 1 | 2 | 3 | 4 | 5;
        if (rating >= 1 && rating <= 5) {
          ratingDistribution[rating]++;
        }
      }
    }

    return {
      id: place.id,
      naverPlaceId: place.naver_place_id,
      name: place.name,
      address: place.address,
      categoryMain: place.category_main,
      categorySub: place.category_sub,
      latitude: place.latitude,
      longitude: place.longitude,
      createdAt: place.created_at,
      updatedAt: place.updated_at,
      statistics: {
        averageRating,
        totalReviews,
        ratingDistribution,
      },
    };
  } catch (error) {
    logger.error('Get place detail error:', error);
    throw error;
  }
}
