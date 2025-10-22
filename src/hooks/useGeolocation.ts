'use client';

// useGeolocation Hook
// 사용자 위치 정보 가져오기

import { useState, useCallback, useEffect } from 'react';
import type { Coordinate, GeolocationError, GeolocationPermission } from '@/types/map';

type UseGeolocationReturn = {
  position: Coordinate | null;
  error: GeolocationError | null;
  loading: boolean;
  permission: GeolocationPermission | null;
  getCurrentPosition: () => void;
  clearError: () => void;
};

/**
 * 사용자의 현재 위치를 가져오는 훅
 *
 * @returns { position, error, loading, permission, getCurrentPosition, clearError }
 *
 * @example
 * const { position, loading, error, getCurrentPosition } = useGeolocation();
 *
 * // 현재 위치 가져오기
 * <button onClick={getCurrentPosition}>현재 위치</button>
 */
export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<Coordinate | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<GeolocationPermission | null>(null);

  // 권한 상태 확인
  useEffect(() => {
    const checkPermission = async () => {
      if (!navigator.permissions) {
        return;
      }

      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermission(result.state as GeolocationPermission);

        // 권한 상태 변경 감지
        result.addEventListener('change', () => {
          setPermission(result.state as GeolocationPermission);
        });
      } catch (err) {
        console.error('권한 확인 오류:', err);
      }
    };

    checkPermission();
  }, []);

  // 위치 정보 가져오기
  const getCurrentPosition = useCallback(() => {
    // Geolocation API 지원 확인
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: '브라우저가 Geolocation을 지원하지 않습니다',
      });
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      // 성공
      (geoPosition) => {
        setPosition({
          lat: geoPosition.coords.latitude,
          lng: geoPosition.coords.longitude,
        });
        setLoading(false);
      },
      // 실패
      (geoError) => {
        const errorMessages: Record<number, string> = {
          1: '위치 정보 접근이 거부되었습니다',
          2: '위치 정보를 가져올 수 없습니다',
          3: '위치 정보 요청이 시간 초과되었습니다',
        };

        setError({
          code: geoError.code,
          message: errorMessages[geoError.code] || geoError.message,
        });
        setLoading(false);
      },
      // 옵션
      {
        enableHighAccuracy: true, // 높은 정확도 요청
        timeout: 10000, // 10초 타임아웃
        maximumAge: 0, // 캐시 사용하지 않음
      }
    );
  }, []);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    position,
    error,
    loading,
    permission,
    getCurrentPosition,
    clearError,
  };
}

/**
 * 위치 정보를 지속적으로 감시하는 훅
 *
 * @returns { position, error, loading }
 *
 * @example
 * const { position } = useWatchGeolocation();
 */
export function useWatchGeolocation(): {
  position: Coordinate | null;
  error: GeolocationError | null;
  loading: boolean;
} {
  const [position, setPosition] = useState<Coordinate | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: '브라우저가 Geolocation을 지원하지 않습니다',
      });
      setLoading(false);
      return;
    }

    setLoading(true);

    const watchId = navigator.geolocation.watchPosition(
      // 성공
      (geoPosition) => {
        setPosition({
          lat: geoPosition.coords.latitude,
          lng: geoPosition.coords.longitude,
        });
        setError(null);
        setLoading(false);
      },
      // 실패
      (geoError) => {
        const errorMessages: Record<number, string> = {
          1: '위치 정보 접근이 거부되었습니다',
          2: '위치 정보를 가져올 수 없습니다',
          3: '위치 정보 요청이 시간 초과되었습니다',
        };

        setError({
          code: geoError.code,
          message: errorMessages[geoError.code] || geoError.message,
        });
        setLoading(false);
      },
      // 옵션
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // cleanup: watchPosition 해제
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { position, error, loading };
}
