"use client";

import Image from "next/image";
import type { Game } from "@/types/game";

interface SearchDropdownProps {
  games: readonly Game[];
  onSelect: (game: Game) => void;
  isLoading?: boolean;
  isOpen?: boolean;
}

export function SearchDropdown({
  games,
  onSelect,
  isLoading = false,
  isOpen = true,
}: SearchDropdownProps) {
  if (!isOpen) return null;

  const containerClass =
    "mt-2 max-h-72 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-md dark:border-neutral-800 dark:bg-neutral-900";

  if (isLoading) {
    return (
      <div
        role="listbox"
        aria-label="게임 검색 결과 로딩 중"
        aria-busy="true"
        className={`${containerClass} px-4 py-3 text-sm text-neutral-500`}
      >
        불러오는 중...
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div
        role="listbox"
        aria-label="검색 결과 없음"
        className={`${containerClass} px-4 py-3 text-sm text-neutral-500`}
      >
        결과가 없습니다.
      </div>
    );
  }

  return (
    <ul role="listbox" aria-label="검색 결과" className={containerClass}>
      {games.map((game) => (
        <li key={game.id} role="option" aria-selected="false">
          <button
            type="button"
            onClick={() => onSelect(game)}
            className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
          >
            {game.thumbnailUrl ? (
              <Image
                src={game.thumbnailUrl}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 flex-none rounded object-cover"
                unoptimized
              />
            ) : (
              <div
                aria-hidden="true"
                className="h-12 w-12 flex-none rounded bg-neutral-200 dark:bg-neutral-800"
              />
            )}
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
              {game.name}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
