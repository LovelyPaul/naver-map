'use client';

// Review Write Page
// 리뷰 작성 페이지

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ReviewFormProvider, useReviewForm } from './context';
import { PlaceInfoSection } from './components/PlaceInfoSection';
import {
  AuthorInput,
  EmailInput,
  RatingInput,
  ContentTextarea,
  PasswordInput,
} from './components/ReviewForm';
import { validateReviewForm } from './validation';
import { useCreateReview } from '@/features/reviews/hooks/useCreateReview';
import { toast } from '@/hooks/use-toast';

type ReviewWritePageProps = {
  searchParams: Promise<{
    placeId?: string;
    placeName?: string;
    address?: string;
    categoryMain?: string;
    categorySub?: string;
  }>;
};

/**
 * 폼 제출 컴포넌트
 * Context에서 상태를 읽고 제출 로직을 처리합니다
 */
function FormContent() {
  const { state, dispatch } = useReviewForm();
  const router = useRouter();
  const createReviewMutation = useCreateReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 전체 폼 검증
    const validation = validateReviewForm(state);
    if (!validation.isValid) {
      dispatch({ type: 'SET_ERRORS', errors: validation.errors });
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '입력 내용을 확인해주세요.',
      });
      return;
    }

    // 제출 중 상태 설정
    dispatch({ type: 'SET_SUBMITTING', value: true });

    try {
      // API 호출
      await createReviewMutation.mutateAsync({
        placeId: state.placeId,
        authorName: state.authorName,
        authorEmail: state.authorEmail || undefined,
        rating: state.rating,
        content: state.content,
        password: state.password,
      });

      // 성공 처리
      toast({
        title: '리뷰 등록 완료',
        description: '리뷰가 성공적으로 등록되었습니다.',
      });
      router.push(`/places/${state.placeId}`);
    } catch (error) {
      // 에러 처리
      const errorMessage =
        error instanceof Error ? error.message : '리뷰 등록에 실패했습니다.';
      toast({
        variant: 'destructive',
        title: '등록 실패',
        description: errorMessage,
      });
      dispatch({ type: 'SET_SUBMITTING', value: false });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-6 pt-6">
            {/* 작성자 정보 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">작성자 정보</h3>
              <AuthorInput />
              <EmailInput />
            </div>

            {/* 평가 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">평가</h3>
              <RatingInput />
            </div>

            {/* 리뷰 내용 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">리뷰 내용</h3>
              <ContentTextarea />
            </div>

            {/* 비밀번호 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">보안</h3>
              <PasswordInput />
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={state.isSubmitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={state.isSubmitting}>
                {state.isSubmitting ? '등록 중...' : '리뷰 등록'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

/**
 * 리뷰 작성 페이지
 */
export default function ReviewWritePage({ searchParams }: ReviewWritePageProps) {
  const params = use(searchParams);

  // placeId가 없으면 에러 처리
  if (!params.placeId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 p-6">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-sm text-slate-800 font-medium">
            장소 정보가 없습니다
          </p>
          <p className="text-xs text-slate-600">
            장소 상세 페이지에서 리뷰 작성 버튼을 눌러주세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ReviewFormProvider
        initialPlaceId={params.placeId}
        initialPlaceName={params.placeName || ''}
        initialPlaceAddress={params.address}
        initialPlaceCategoryMain={params.categoryMain}
        initialPlaceCategorySub={params.categorySub}
      >
        <PlaceInfoSection />
        <FormContent />
      </ReviewFormProvider>
    </div>
  );
}
