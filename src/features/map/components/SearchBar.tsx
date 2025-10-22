'use client';

// SearchBar Component
// 장소 검색 입력 컴포넌트

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * SearchBar Props
 */
type SearchBarProps = {
  /** 검색 실행 콜백 */
  onSearch: (query: string) => void;
  /** 초기 검색어 */
  defaultValue?: string;
  /** placeholder 텍스트 */
  placeholder?: string;
  /** 추가 CSS 클래스명 */
  className?: string;
};

/**
 * 장소 검색 입력 컴포넌트
 *
 * @example
 * ```tsx
 * <SearchBar
 *   onSearch={(query) => console.log('검색:', query)}
 *   placeholder="음식점, 카페 검색"
 * />
 * ```
 */
export function SearchBar({
  onSearch,
  defaultValue = '',
  placeholder = '장소를 검색하세요',
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery.length >= 2) {
      onSearch(trimmedQuery);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className={`w-full max-w-md ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center gap-2 bg-white rounded-lg shadow-lg border border-slate-200">
          {/* 검색 아이콘 */}
          <div className="absolute left-3 pointer-events-none">
            <Search className="w-5 h-5 text-slate-400" />
          </div>

          {/* 검색 입력 필드 */}
          <Input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder={placeholder}
            className="pl-10 pr-20 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          {/* 지우기 버튼 */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-16 p-1 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="검색어 지우기"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}

          {/* 검색 버튼 */}
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 top-1 bottom-1"
            disabled={query.trim().length < 2}
          >
            검색
          </Button>
        </div>

        {/* 최소 글자수 안내 */}
        {query.length > 0 && query.trim().length < 2 && (
          <p className="mt-1 text-xs text-slate-500 pl-3">
            최소 2자 이상 입력해주세요
          </p>
        )}
      </form>
    </div>
  );
}
