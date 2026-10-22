import { z } from 'zod';

// Campos reutilizáveis
const email = z.string().trim().min(1, 'Informe o e-mail').email('E-mail inválido');

// Login
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha'),
});

// Cadastro
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome'),
    email,
    password: z.string().min(6, 'Use pelo menos 6 caracteres'),
    confirm: z.string().min(1, 'Confirme a senha'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'As senhas não conferem',
    path: ['confirm'],
  });

// Tipos
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
