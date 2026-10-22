import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { queryClient } from '@/lib/queryClient';

// Layout raiz. A ordem dos providers importa: o CartProvider usa o useAuth,
// então precisa ficar dentro do AuthProvider.
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}