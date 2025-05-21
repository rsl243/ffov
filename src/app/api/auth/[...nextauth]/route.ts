import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authConfig } from '@/lib/auth.config';

// Configuration de NextAuth avec CredentialsProvider
const handler = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        // Pour les tests, accepter certaines combinaisons email/mot de passe
        if (credentials.email === 'test@example.com' && credentials.password === 'password') {
          return {
            id: '1',
            email: 'test@example.com',
            name: 'Utilisateur Test',
          };
        }
        
        return null;
      },
    }),
  ],
});

export { handler as GET, handler as POST };
