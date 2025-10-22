'use client';

// Review Write Context
// 리뷰 작성 폼 상태 관리

import { createContext, useContext, useReducer, type ReactNode } from 'react';

/**
 * 리뷰 작성 폼 상태
 */
export type ReviewFormState = {
  placeId: string;
  placeName: string;
  authorName: string;
  authorEmail: string;
  rating: number;
  content: string;
  password: string;
  errors: {
    authorName?: string;
    authorEmail?: string;
    rating?: string;
    content?: string;
    password?: string;
  };
  isDirty: boolean;
  isSubmitting: boolean;
};

/**
 * 리뷰 작성 폼 액션
 */
export type ReviewFormAction =
  | { type: 'SET_PLACE'; placeId: string; placeName: string }
  | { type: 'SET_AUTHOR_NAME'; value: string }
  | { type: 'SET_AUTHOR_EMAIL'; value: string }
  | { type: 'SET_RATING'; value: number }
  | { type: 'SET_CONTENT'; value: string }
  | { type: 'SET_PASSWORD'; value: string }
  | { type: 'SET_ERROR'; field: keyof ReviewFormState['errors']; message: string }
  | { type: 'CLEAR_ERROR'; field: keyof ReviewFormState['errors'] }
  | { type: 'SET_ERRORS'; errors: ReviewFormState['errors'] }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_SUBMITTING'; value: boolean }
  | { type: 'RESET' };

/**
 * 초기 상태
 */
const initialState: ReviewFormState = {
  placeId: '',
  placeName: '',
  authorName: '',
  authorEmail: '',
  rating: 0,
  content: '',
  password: '',
  errors: {},
  isDirty: false,
  isSubmitting: false,
};

/**
 * Reducer 함수
 */
function reviewFormReducer(state: ReviewFormState, action: ReviewFormAction): ReviewFormState {
  switch (action.type) {
    case 'SET_PLACE':
      return { ...state, placeId: action.placeId, placeName: action.placeName };

    case 'SET_AUTHOR_NAME':
      return { ...state, authorName: action.value, isDirty: true };

    case 'SET_AUTHOR_EMAIL':
      return { ...state, authorEmail: action.value, isDirty: true };

    case 'SET_RATING':
      return { ...state, rating: action.value, isDirty: true };

    case 'SET_CONTENT':
      return { ...state, content: action.value, isDirty: true };

    case 'SET_PASSWORD':
      return { ...state, password: action.value, isDirty: true };

    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.message },
      };

    case 'CLEAR_ERROR':
      const { [action.field]: _, ...restErrors } = state.errors;
      return { ...state, errors: restErrors };

    case 'SET_ERRORS':
      return { ...state, errors: action.errors };

    case 'CLEAR_ERRORS':
      return { ...state, errors: {} };

    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.value };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

/**
 * Context 타입
 */
type ReviewFormContextValue = {
  state: ReviewFormState;
  dispatch: React.Dispatch<ReviewFormAction>;
};

const ReviewFormContext = createContext<ReviewFormContextValue | null>(null);

/**
 * Provider Props
 */
type ReviewFormProviderProps = {
  children: ReactNode;
  initialPlaceId?: string;
  initialPlaceName?: string;
};

/**
 * Provider 컴포넌트
 */
export function ReviewFormProvider({
  children,
  initialPlaceId = '',
  initialPlaceName = '',
}: ReviewFormProviderProps) {
  const [state, dispatch] = useReducer(reviewFormReducer, {
    ...initialState,
    placeId: initialPlaceId,
    placeName: initialPlaceName,
  });

  return (
    <ReviewFormContext.Provider value={{ state, dispatch }}>
      {children}
    </ReviewFormContext.Provider>
  );
}

/**
 * Hook for accessing context
 */
export function useReviewForm() {
  const context = useContext(ReviewFormContext);
  if (!context) {
    throw new Error('useReviewForm must be used within ReviewFormProvider');
  }
  return context;
}
