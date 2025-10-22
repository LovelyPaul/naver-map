// Review Types
// 리뷰 관련 타입 정의

/**
 * 리뷰 기본 정보 (DB 저장용)
 */
export type Review = {
  id: string; // UUID
  placeId: string; // UUID (places 테이블 FK)
  authorName: string;
  authorEmail: string | null;
  rating: number; // 1-5
  content: string; // 최대 500자
  createdAt: string;
  updatedAt: string;
};

/**
 * 리뷰 작성 폼 데이터
 */
export type ReviewFormData = {
  authorName: string;
  authorEmail: string;
  rating: number; // 0 = 미선택, 1-5 = 선택
  content: string;
  password: string;
};

/**
 * 리뷰 생성 요청 데이터
 */
export type CreateReviewRequest = {
  placeId: string;
  authorName: string;
  authorEmail?: string;
  rating: number;
  content: string;
  password: string;
};

/**
 * 리뷰 생성 응답 데이터
 */
export type CreateReviewResponse = {
  id: string;
  placeId: string;
  authorName: string;
  rating: number;
  content: string;
  createdAt: string;
};

/**
 * 리뷰 수정 요청 데이터
 */
export type UpdateReviewRequest = {
  rating?: number;
  content?: string;
  password: string; // 검증용
};

/**
 * 리뷰 삭제 요청 데이터
 */
export type DeleteReviewRequest = {
  password: string; // 검증용
};

/**
 * 리뷰 목록 페이지네이션 응답
 */
export type ReviewsPageResponse = {
  items: Review[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
  };
};

/**
 * 리뷰 통계 정보
 */
export type ReviewStatistics = {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
};
