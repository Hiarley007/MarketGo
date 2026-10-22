import { useQuery } from '@tanstack/react-query';
import {
  getProduct,
  getStore,
  listProducts,
  listStores,
} from '@/services/stores';

const STALE_TIME = 60_000;

// Lojas

export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: listStores,
    staleTime: STALE_TIME,
  });
}

export function useStore(id: string | undefined) {
  return useQuery({
    queryKey: ['stores', id],
    queryFn: () => getStore(id as string),
    enabled: Boolean(id),
    staleTime: STALE_TIME,
  });
}

// Produtos

export function useProducts(storeId: string | undefined) {
  return useQuery({
    queryKey: ['products', 'store', storeId],
    queryFn: () => listProducts(storeId as string),
    enabled: Boolean(storeId),
    staleTime: STALE_TIME,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['products', 'detail', id],
    queryFn: () => getProduct(id as string),
    enabled: Boolean(id),
    staleTime: STALE_TIME,
  });
}