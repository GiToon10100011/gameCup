"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchInputProps {
  onDebouncedChange: (query: string) => void;
  placeholder?: string;
  delayMs?: number;
}

export function SearchInput({
  onDebouncedChange,
  placeholder = "게임 이름을 입력하세요",
  delayMs = 300,
}: SearchInputProps) {
  const [value, setValue] = useState("");
  const debounced = useDebounce(value, delayMs);

  useEffect(() => {
    onDebouncedChange(debounced.trim());
  }, [debounced, onDebouncedChange]);

  return (
    <input
      type="search"
      role="searchbox"
      aria-label="게임 검색"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base shadow-sm transition placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
    />
  );
}
