'use client';

// Review Form Components
// 리뷰 작성 폼 입력 컴포넌트들

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CharacterCounter } from '@/components/common/CharacterCounter';
import { Star } from 'lucide-react';
import { useReviewForm } from '../context';
import { validateField } from '../validation';

/**
 * 작성자 이름 입력 컴포넌트
 */
export function AuthorInput() {
  const { state, dispatch } = useReviewForm();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    dispatch({ type: 'SET_AUTHOR_NAME', value });

    // 실시간 검증
    const error = validateField('authorName', value);
    if (error) {
      dispatch({ type: 'SET_ERROR', field: 'authorName', message: error });
    } else {
      dispatch({ type: 'CLEAR_ERROR', field: 'authorName' });
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="authorName">
        작성자 이름 <span className="text-red-500">*</span>
      </Label>
      <Input
        id="authorName"
        type="text"
        value={state.authorName}
        onChange={handleChange}
        placeholder="이름을 입력하세요"
        maxLength={20}
      />
      {state.errors.authorName && (
        <p className="text-sm text-red-500">{state.errors.authorName}</p>
      )}
    </div>
  );
}

/**
 * 이메일 입력 컴포넌트
 */
export function EmailInput() {
  const { state, dispatch } = useReviewForm();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    dispatch({ type: 'SET_AUTHOR_EMAIL', value });

    // 실시간 검증
    const error = validateField('authorEmail', value);
    if (error) {
      dispatch({ type: 'SET_ERROR', field: 'authorEmail', message: error });
    } else {
      dispatch({ type: 'CLEAR_ERROR', field: 'authorEmail' });
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="authorEmail">이메일 (선택)</Label>
      <Input
        id="authorEmail"
        type="email"
        value={state.authorEmail}
        onChange={handleChange}
        placeholder="email@example.com"
        maxLength={100}
      />
      {state.errors.authorEmail && (
        <p className="text-sm text-red-500">{state.errors.authorEmail}</p>
      )}
    </div>
  );
}

/**
 * 별점 입력 컴포넌트
 */
export function RatingInput() {
  const { state, dispatch } = useReviewForm();

  const handleRatingClick = (rating: number) => {
    dispatch({ type: 'SET_RATING', value: rating });
    dispatch({ type: 'CLEAR_ERROR', field: 'rating' });
  };

  return (
    <div className="space-y-2">
      <Label>
        별점 <span className="text-red-500">*</span>
      </Label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleRatingClick(rating)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-10 h-10 ${
                rating <= state.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-slate-300'
              }`}
            />
          </button>
        ))}
        {state.rating > 0 && (
          <span className="ml-2 text-sm text-slate-600">{state.rating}점</span>
        )}
      </div>
      {state.errors.rating && (
        <p className="text-sm text-red-500">{state.errors.rating}</p>
      )}
    </div>
  );
}

/**
 * 리뷰 내용 입력 컴포넌트
 */
export function ContentTextarea() {
  const { state, dispatch } = useReviewForm();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 500) {
      dispatch({ type: 'SET_CONTENT', value });

      // 실시간 검증
      const error = validateField('content', value);
      if (error) {
        dispatch({ type: 'SET_ERROR', field: 'content', message: error });
      } else {
        dispatch({ type: 'CLEAR_ERROR', field: 'content' });
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="content">
        리뷰 내용 <span className="text-red-500">*</span>
      </Label>
      <Textarea
        id="content"
        value={state.content}
        onChange={handleChange}
        placeholder="이 장소에 대한 솔직한 리뷰를 작성해주세요 (최소 10자)"
        rows={6}
        maxLength={500}
      />
      <CharacterCounter current={state.content.length} max={500} />
      {state.errors.content && (
        <p className="text-sm text-red-500">{state.errors.content}</p>
      )}
    </div>
  );
}

/**
 * 비밀번호 입력 컴포넌트
 */
export function PasswordInput() {
  const { state, dispatch } = useReviewForm();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    dispatch({ type: 'SET_PASSWORD', value });

    // 실시간 검증
    const error = validateField('password', value);
    if (error) {
      dispatch({ type: 'SET_ERROR', field: 'password', message: error });
    } else {
      dispatch({ type: 'CLEAR_ERROR', field: 'password' });
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="password">
        비밀번호 <span className="text-red-500">*</span>
      </Label>
      <Input
        id="password"
        type="password"
        value={state.password}
        onChange={handleChange}
        placeholder="리뷰 수정/삭제 시 사용할 비밀번호"
        maxLength={20}
      />
      <p className="text-xs text-slate-500">
        리뷰를 수정하거나 삭제할 때 필요합니다 (4자 이상)
      </p>
      {state.errors.password && (
        <p className="text-sm text-red-500">{state.errors.password}</p>
      )}
    </div>
  );
}
