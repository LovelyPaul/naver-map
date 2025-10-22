// Naver Maps SDK Loader
// 네이버 지도 JavaScript SDK 동적 로딩

type LoaderStatus = 'idle' | 'loading' | 'loaded' | 'error';

let loaderStatus: LoaderStatus = 'idle';
let loadPromise: Promise<void> | null = null;

/**
 * 네이버 지도 SDK를 동적으로 로드
 *
 * @returns Promise<void>
 * @throws Error SDK 로드 실패 시
 *
 * @example
 * await loadNaverMapsScript();
 * // window.naver.maps 사용 가능
 */
export async function loadNaverMapsScript(): Promise<void> {
  // 이미 로드되었으면 즉시 반환
  if (loaderStatus === 'loaded' && typeof window !== 'undefined' && window.naver?.maps) {
    return Promise.resolve();
  }

  // 로딩 중이면 기존 Promise 반환
  if (loaderStatus === 'loading' && loadPromise) {
    return loadPromise;
  }

  // 클라이언트 ID 확인
  const clientId = process.env.NEXT_PUBLIC_NCP_MAPS_CLIENT_ID;
  if (!clientId) {
    const error = new Error('NEXT_PUBLIC_NCP_MAPS_CLIENT_ID 환경 변수가 설정되지 않았습니다');
    loaderStatus = 'error';
    throw error;
  }

  // 인증 실패 핸들러 등록
  if (typeof window !== 'undefined') {
    (window as any).navermap_authFailure = function () {
      console.error('네이버 지도 API 인증 실패: 클라이언트 ID와 웹 서비스 URL을 확인해주세요.');
      loaderStatus = 'error';
    };
  }

  // 새로운 로드 시작
  loaderStatus = 'loading';

  loadPromise = new Promise<void>((resolve, reject) => {
    // 서버 사이드에서는 로드하지 않음
    if (typeof window === 'undefined') {
      loaderStatus = 'error';
      reject(new Error('네이버 지도 SDK는 브라우저 환경에서만 로드할 수 있습니다'));
      return;
    }

    // 이미 window.naver.maps가 존재하는지 확인
    if (window.naver?.maps) {
      loaderStatus = 'loaded';
      resolve();
      return;
    }

    // 스크립트 태그 생성
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;

    // 로드 성공
    script.onload = () => {
      // naver.maps가 제대로 로드되었는지 확인
      if (window.naver?.maps) {
        loaderStatus = 'loaded';
        resolve();
      } else {
        loaderStatus = 'error';
        reject(new Error('네이버 지도 SDK가 제대로 로드되지 않았습니다'));
      }
    };

    // 로드 실패
    script.onerror = () => {
      loaderStatus = 'error';
      reject(new Error('네이버 지도 SDK 로드에 실패했습니다'));
    };

    // DOM에 스크립트 추가
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * 네이버 지도 SDK 로더 상태 확인
 *
 * @returns LoaderStatus
 */
export function getLoaderStatus(): LoaderStatus {
  return loaderStatus;
}

/**
 * 네이버 지도 SDK가 로드되었는지 확인
 *
 * @returns boolean
 */
export function isNaverMapsLoaded(): boolean {
  return loaderStatus === 'loaded' && typeof window !== 'undefined' && !!window.naver?.maps;
}

/**
 * 로더 상태 초기화 (테스트용)
 */
export function resetLoader(): void {
  loaderStatus = 'idle';
  loadPromise = null;
}
