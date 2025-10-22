'use client';

// Password Dialog Component
// 비밀번호 입력 다이얼로그

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type PasswordDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void | Promise<void>;
  title: string;
  description: string;
  isLoading?: boolean;
};

/**
 * 비밀번호 입력 다이얼로그
 * Dialog 컴포넌트 설치 전까지 임시로 사용하는 간단한 모달
 */
export function PasswordDialog({
  open,
  onClose,
  onSubmit,
  title,
  description,
  isLoading = false,
}: PasswordDialogProps) {
  const [password, setPassword] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    await onSubmit(password);
    setPassword('');
  };

  const handleClose = () => {
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
      <Card className="relative z-10 w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button type="submit" disabled={isLoading || !password.trim()}>
                {isLoading ? '처리 중...' : '확인'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
