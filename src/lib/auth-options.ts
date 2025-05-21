import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
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

        // Utiliser une approche simplifiée sans base de données
        // Dans un environnement de production, vous utiliseriez une vraie base de données
        // Ici, nous acceptons simplement quelques utilisateurs codés en dur pour les tests
        
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
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/connexion',
    newUser: '/onboarding',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        // Ajouter l'ID à l'objet utilisateur de la session
        (session.user as any).id = token.sub as string;
      }
      return session;
    },
  },
};
