// Review Form Validation
// 리뷰 작성 폼 검증 로직

import type { ReviewFormState } from './context';

/**
 * 검증 결과 타입
 */
type ValidationResult = {
  isValid: boolean;
  errors: ReviewFormState['errors'];
};

/**
 * 작성자 이름 검증
 */
export function validateAuthorName(name: string): string | undefined {
  if (!name.trim()) {
    return '작성자 이름을 입력해주세요';
  }
  if (name.trim().length < 2) {
    return '작성자 이름은 최소 2자 이상이어야 합니다';
  }
  if (name.length > 20) {
    return '작성자 이름은 최대 20자까지 입력 가능합니다';
  }
  return undefined;
}

/**
 * 이메일 검증 (선택 사항)
 */
export function validateAuthorEmail(email: string): string | undefined {
  // 빈 값은 허용 (선택 사항)
  if (!email.trim()) {
    return undefined;
  }

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return '올바른 이메일 형식을 입력해주세요';
  }

  if (email.length > 100) {
    return '이메일은 최대 100자까지 입력 가능합니다';
  }

  return undefined;
}

/**
 * 평점 검증
 */
export function validateRating(rating: number): string | undefined {
  if (rating === 0) {
    return '별점을 선택해주세요';
  }
  if (rating < 1 || rating > 5) {
    return '별점은 1점에서 5점 사이여야 합니다';
  }
  return undefined;
}

/**
 * 리뷰 내용 검증
 */
export function validateContent(content: string): string | undefined {
  if (!content.trim()) {
    return '리뷰 내용을 입력해주세요';
  }
  if (content.trim().length < 10) {
    return '리뷰 내용은 최소 10자 이상이어야 합니다';
  }
  if (content.length > 500) {
    return '리뷰 내용은 최대 500자까지 입력 가능합니다';
  }
  return undefined;
}

/**
 * 비밀번호 검증
 */
export function validatePassword(password: string): string | undefined {
  if (!password) {
    return '비밀번호를 입력해주세요';
  }
  if (password.length < 4) {
    return '비밀번호는 최소 4자 이상이어야 합니다';
  }
  if (password.length > 20) {
    return '비밀번호는 최대 20자까지 입력 가능합니다';
  }
  return undefined;
}

/**
 * 전체 폼 검증
 */
export function validateReviewForm(state: ReviewFormState): ValidationResult {
  const errors: ReviewFormState['errors'] = {};

  // 각 필드 검증
  const authorNameError = validateAuthorName(state.authorName);
  if (authorNameError) errors.authorName = authorNameError;

  const authorEmailError = validateAuthorEmail(state.authorEmail);
  if (authorEmailError) errors.authorEmail = authorEmailError;

  const ratingError = validateRating(state.rating);
  if (ratingError) errors.rating = ratingError;

  const contentError = validateContent(state.content);
  if (contentError) errors.content = contentError;

  const passwordError = validatePassword(state.password);
  if (passwordError) errors.password = passwordError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * 개별 필드 검증 헬퍼
 */
export function validateField(
  field: keyof ReviewFormState['errors'],
  value: string | number
): string | undefined {
  switch (field) {
    case 'authorName':
      return validateAuthorName(value as string);
    case 'authorEmail':
      return validateAuthorEmail(value as string);
    case 'rating':
      return validateRating(value as number);
    case 'content':
      return validateContent(value as string);
    case 'password':
      return validatePassword(value as string);
    default:
      return undefined;
  }
}
