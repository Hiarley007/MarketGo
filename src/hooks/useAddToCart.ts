import { useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useCart } from '@/context/CartContext';
import type { Product, Store } from '@/types';

// Tipos

type CartStore = Pick<Store, 'id' | 'name' | 'delivery_fee' | 'min_order' | 'is_open'>;
type CartProduct = Pick<Product, 'id' | 'name' | 'emoji' | 'price'>;

// Avisos que funcionam no celular e no navegador
// (Alert.alert com botões não funciona no web)

function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

function askToReplace(message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`Trocar de loja?\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert('Trocar de loja?', message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Esvaziar e adicionar', style: 'destructive', onPress: onConfirm },
  ]);
}

// Hook

// Adiciona ao carrinho tratando os dois casos especiais: loja fechada e troca de loja.
export function useAddToCart() {
  const { cart, add, replaceWith } = useCart();

  return useCallback(
    (store: CartStore, product: CartProduct, quantity = 1, onAdded?: () => void) => {
      // Caso 1: loja fechada
      if (!store.is_open) {
        showMessage('Loja fechada', 'Esta loja não está aceitando pedidos agora.');
        return;
      }

      // Caminho normal: adicionou ao carrinho
      if (add(store, product, quantity) === 'added') {
        onAdded?.();
        return;
      }

      // Caso 2: o carrinho é de outra loja, então pergunta se deve trocar
      askToReplace(
        `Seu carrinho tem itens de ${cart.storeName}. ` +
          `Deseja esvaziá-lo e começar um pedido em ${store.name}?`,
        () => {
          replaceWith(store, product, quantity);
          onAdded?.();
        },
      );
    },
    [add, replaceWith, cart.storeName],
  );
}