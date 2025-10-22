'use client';

// Edit Review Dialog Component
// 리뷰 수정 다이얼로그

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star } from 'lucide-react';
import type { Review } from '@/types/review';

type EditReviewDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; content: string; password: string }) => void | Promise<void>;
  review: Review;
  isLoading?: boolean;
};

/**
 * 리뷰 수정 다이얼로그
 */
export function EditReviewDialog({
  open,
  onClose,
  onSubmit,
  review,
  isLoading = false,
}: EditReviewDialogProps) {
  const [rating, setRating] = useState(review.rating);
  const [content, setContent] = useState(review.content);
  const [password, setPassword] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    if (open) {
      setRating(review.rating);
      setContent(review.content);
      setPassword('');
    }
  }, [open, review]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || !content.trim()) return;

    await onSubmit({ rating, content, password });
    setPassword('');
  };

  const handleClose = () => {
    setRating(review.rating);
    setContent(review.content);
    setPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Dialog Content */}
      <Card className="relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>리뷰 수정</CardTitle>
          <CardDescription>
            리뷰 작성 시 입력한 비밀번호를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 평점 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                평점 *
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                    disabled={isLoading}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-slate-600 self-center">
                  {rating}점
                </span>
              </div>
            </div>

            {/* 리뷰 내용 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                리뷰 내용 *
              </label>
              <Textarea
                placeholder="리뷰 내용을 입력하세요 (최대 500자)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isLoading}
                maxLength={500}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-slate-500 text-right">
                {content.length} / 500
              </p>
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                비밀번호 *
              </label>
              <Input
                type="password"
                placeholder="리뷰 작성 시 입력한 비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !password.trim() || !content.trim()}
              >
                {isLoading ? '수정 중...' : '수정하기'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
