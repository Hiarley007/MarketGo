import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme';
import { MAX_QUANTITY } from '@/utils/cart';

// Tipos

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}

// Componente

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = MAX_QUANTITY,
}: QuantityStepperProps) {
  const atMin = value <= min;
  const atMax = value >= max;
  // Com mínimo 0 e quantidade 1, o botão de diminuir remove o item.
  const decreaseIcon = value === 1 && min === 0 ? 'trash-outline' : 'remove';

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Diminuir quantidade"
        disabled={atMin}
        onPress={() => onChange(value - 1)}
        style={[styles.button, atMin && styles.disabled]}
      >
        <Ionicons name={decreaseIcon} size={20} color={colors.primary} />
      </Pressable>

      <Text style={styles.value}>{value}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Aumentar quantidade"
        disabled={atMax}
        onPress={() => onChange(value + 1)}
        style={[styles.button, atMax && styles.disabled]}
      >
        <Ionicons name="add" size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

// Estilos

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  button: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  value: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
