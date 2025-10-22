// Date Utility Functions
// 날짜 관련 유틸리티 함수

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * ISO 날짜 문자열을 상대 시간으로 포맷팅
 *
 * @param isoDate ISO 8601 날짜 문자열
 * @returns 상대 시간 문자열 (예: "3분 전", "2시간 전", "5일 전")
 *
 * @example
 * formatRelativeTime("2024-01-15T10:30:00Z") // "3분 전"
 * formatRelativeTime("2024-01-14T10:30:00Z") // "1일 전"
 */
export function formatRelativeTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);

    if (Number.isNaN(date.getTime())) {
      return '알 수 없음';
    }

    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: ko,
    });
  } catch (error) {
    console.error('날짜 포맷 오류:', error);
    return '알 수 없음';
  }
}

/**
 * ISO 날짜 문자열을 로컬 날짜 문자열로 포맷팅
 *
 * @param isoDate ISO 8601 날짜 문자열
 * @returns 로컬 날짜 문자열 (예: "2024.01.15")
 *
 * @example
 * formatLocalDate("2024-01-15T10:30:00Z") // "2024.01.15"
 */
export function formatLocalDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);

    if (Number.isNaN(date.getTime())) {
      return '알 수 없음';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}.${month}.${day}`;
  } catch (error) {
    console.error('날짜 포맷 오류:', error);
    return '알 수 없음';
  }
}

/**
 * ISO 날짜 문자열을 로컬 날짜+시간 문자열로 포맷팅
 *
 * @param isoDate ISO 8601 날짜 문자열
 * @returns 로컬 날짜+시간 문자열 (예: "2024.01.15 10:30")
 *
 * @example
 * formatLocalDateTime("2024-01-15T10:30:00Z") // "2024.01.15 10:30"
 */
export function formatLocalDateTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);

    if (Number.isNaN(date.getTime())) {
      return '알 수 없음';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}.${month}.${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error('날짜 포맷 오류:', error);
    return '알 수 없음';
  }
}
