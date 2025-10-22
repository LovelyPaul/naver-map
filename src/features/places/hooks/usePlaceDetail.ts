'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { PlaceDetailResponseSchema } from '@/features/places/lib/dto';
import type { PlaceDetail } from '@/types/place';

const getPlaceDetail = async (placeId: string): Promise<PlaceDetail> => {
  try {
    const { data } = await apiClient.get(`/api/places/${placeId}`);
    const parsed = PlaceDetailResponseSchema.parse(data);
    return parsed as PlaceDetail;
  } catch (error) {
    const message = extractApiErrorMessage(error, '장소 정보를 불러올 수 없습니다.');
    throw new Error(message);
  }
};

/**
 * 장소 상세 정보 조회 훅
 *
 * @param placeId 장소 ID
 * @param options React Query 옵션
 * @returns React Query 결과
 *
 * @example
 * ```tsx
 * const { data: place, isLoading, error } = usePlaceDetail(placeId);
 * const { data: place } = usePlaceDetail(placeId, { enabled: false }); // 조회 비활성화
 * ```
 */
export const usePlaceDetail = (placeId: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['places', placeId],
    queryFn: () => getPlaceDetail(placeId),
    enabled: options?.enabled !== undefined ? options.enabled : Boolean(placeId),
    staleTime: 5 * 60 * 1000, // 5분
  });
