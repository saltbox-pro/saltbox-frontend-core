import { useCallback, useEffect, useRef } from "react";

export type UseInfiniteScrollProps = {
  hasMore: boolean;
  isLoading: boolean;
  rootMargin: string;
  onLoadMore: () => void;
};

export const useInfiniteScroll = (props: UseInfiniteScrollProps) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && props.hasMore && !props.isLoading) {
        props.onLoadMore();
      }
    },
    [props.hasMore, props.isLoading, props.onLoadMore]
  );

  useEffect(() => {
    const element = loadingRef.current;
    if (!element) {
      return;
    }

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: props.rootMargin,
      threshold: 0.1,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  return { loadingRef };
};
