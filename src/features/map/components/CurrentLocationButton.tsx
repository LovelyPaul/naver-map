'use client';

// CurrentLocationButton Component
// 현재 위치로 이동하는 버튼

import { useEffect } from 'react';
import { Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useMap } from './MapContainer';
import { useToast } from '@/hooks/use-toast';

/**
 * CurrentLocationButton Props
 */
type CurrentLocationButtonProps = {
  /** 추가 CSS 클래스명 */
  className?: string;
};

/**
 * 현재 위치로 지도 중심을 이동하는 버튼
 *
 * @example
 * ```tsx
 * <MapContainer center={center} zoom={15}>
 *   <CurrentLocationButton />
 * </MapContainer>
 * ```
 */
export function CurrentLocationButton({ className = '' }: CurrentLocationButtonProps) {
  const { map } = useMap();
  const { position, error, loading, getCurrentPosition, clearError } = useGeolocation();
  const { toast } = useToast();

  // 위치 정보를 받으면 지도 중심 이동
  useEffect(() => {
    if (position && map) {
      const newCenter = new window.naver.maps.LatLng(position.lat, position.lng);
      map.setCenter(newCenter);
      map.setZoom(16); // 줌 레벨도 조정

      toast({
        title: '현재 위치로 이동했습니다',
        description: `위도: ${position.lat.toFixed(6)}, 경도: ${position.lng.toFixed(6)}`,
      });
    }
  }, [position, map, toast]);

  // 에러 발생 시 토스트 표시
  useEffect(() => {
    if (error) {
      toast({
        title: '위치 정보를 가져올 수 없습니다',
        description: error.message,
        variant: 'destructive',
      });
      clearError();
    }
  }, [error, toast, clearError]);

  const handleClick = () => {
    getCurrentPosition();
  };

  return (
    <div className={className}>
      <Button
        onClick={handleClick}
        disabled={loading}
        size="icon"
        className="w-12 h-12 rounded-full shadow-lg"
        aria-label="현재 위치로 이동"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Navigation className="w-5 h-5" />
        )}
      </Button>
    </div>
  );
}
