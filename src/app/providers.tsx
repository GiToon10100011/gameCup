"use client";

// 전역 클라이언트 측 Provider 모음.
// 서버 컴포넌트(layout.tsx)는 useState를 못 쓰기 때문에 본 파일을 클라이언트 컴포넌트로 분리해 주입한다.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

/**
 * TanStack Query 등 클라이언트 측 컨텍스트를 children에게 제공한다.
 * - QueryClient는 한 번만 만들어야 하므로 useState lazy initializer로 보관
 *   (매 렌더마다 새 인스턴스가 생기면 캐시가 무효화됨)
 */
export function Providers({ children }: { children: ReactNode }) {
  // 1) QueryClient는 컴포넌트 mount 시 한 번만 생성
  const [client] = useState(() => new QueryClient());

  // 2) 하위 트리 전체에 Query 컨텍스트 제공
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
