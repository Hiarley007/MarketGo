import Constants from 'expo-constants';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme';
import { friendlyError } from '@/utils/errors';

// Tela

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const name = String(user?.user_metadata?.full_name ?? 'Usuário');

  async function doSignOut() {
    try {
      await signOut();
    } catch (e) {
      if (Platform.OS === 'web') {
        window.alert(friendlyError(e));
      } else {
        Alert.alert('Erro', friendlyError(e));
      }
    }
  }

  function confirmSignOut() {
    // No web, Alert.alert com botões não funciona: usamos window.confirm
    if (Platform.OS === 'web') {
      if (window.confirm('Deseja encerrar a sessão?')) {
        doSignOut();
      }
      return;
    }

    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: doSignOut },
    ]);
  }

  return (
    <Screen scroll>
      <Text style={styles.title}>Perfil</Text>

      <Card>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </Card>

      <Card>
        <Text style={styles.infoTitle}>Sobre este app</Text>
        <Text style={styles.infoText}>
          Projeto de estudo. Os pagamentos são simulados e nenhum pedido é
          entregue de verdade. O carrinho fica salvo no seu aparelho.
        </Text>
      </Card>

      <Button title="Sair da conta" variant="danger" onPress={confirmSignOut} />

      <Text style={styles.version}>
        MarketGo v{Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </Screen>
  );
}

// Estilos

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 2,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  infoText: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  version: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.lg,
  },
});