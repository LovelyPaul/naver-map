'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { SearchPlacesResponseSchema } from '@/features/places/lib/dto';
import type { PlaceListItem } from '@/types/place';

const searchPlaces = async (query: string, limit = 10): Promise<PlaceListItem[]> => {
  try {
    const { data } = await apiClient.get('/api/places/search', {
      params: { query, limit },
    });
    const parsed = SearchPlacesResponseSchema.parse(data);
    return parsed.data.items as PlaceListItem[];
  } catch (error) {
    const message = extractApiErrorMessage(error, '장소 검색에 실패했습니다.');
    throw new Error(message);
  }
};

/**
 * 장소 검색 훅
 *
 * @param query 검색어
 * @param limit 결과 개수 제한 (기본값: 10)
 * @returns React Query 결과
 *
 * @example
 * ```tsx
 * const { data: places, isLoading, error } = useSearchPlaces('강남 맛집');
 * ```
 */
export const useSearchPlaces = (query: string, limit = 10) =>
  useQuery({
    queryKey: ['places', 'search', query, limit],
    queryFn: () => searchPlaces(query, limit),
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // 5분
  });
