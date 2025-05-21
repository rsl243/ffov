import { Adapter, AdapterAccount, AdapterSession, AdapterUser } from "next-auth/adapters";
import { supabase } from "@/lib/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

export function SupabaseAdapter(): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, "id">): Promise<AdapterUser> {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email!,
        email_confirm: true,
        user_metadata: {
          first_name: user.name?.split(' ')[0] || '',
          last_name: user.name?.split(' ').slice(1).join(' ') || '',
        },
      });

      if (error || !data.user) {
        console.error('Error creating user:', error);
        throw error || new Error('Failed to create user');
      }

      return {
        id: data.user.id,
        name: user.name,
        email: data.user.email!,
        emailVerified: null,
        image: user.image,
      };
    },

    async getUser(id: string): Promise<AdapterUser | null> {
      const { data, error } = await supabase.auth.admin.getUserById(id);
      
      if (error || !data.user) {
        console.error('Error getting user:', error);
        return null;
      }

      return {
        id: data.user.id,
        email: data.user.email!,
        emailVerified: null,
        name: data.user.user_metadata?.name || '',
        image: null,
      };
    },

    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      const { data, error } = await supabase.auth.admin.getUserById(email);
      
      if (error || !data.user) {
        console.error('Error getting user by email:', error);
        return null;
      }

      return {
        id: data.user.id,
        email: data.user.email!,
        emailVerified: null,
        name: data.user.user_metadata?.name || '',
        image: null,
      };
    },

    async getUserByAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }): Promise<AdapterUser | null> {
      const { data, error } = await supabase
        .from('accounts')
        .select('user')
        .eq('providerAccountId', providerAccountId)
        .eq('provider', provider)
        .single();

      if (error || !data) {
        console.error('Error getting user by account:', error);
        return null;
      }

      if (data.user && data.user.id) {
        return this.getUser(data.user.id);
      }
      return null;
    },

    async updateUser(user: Partial<AdapterUser> & Pick<AdapterUser, "id">): Promise<AdapterUser> {
      const { error } = await supabase.auth.admin.updateUserById(user.id!, {
        email: user.email,
        user_metadata: {
          name: user.name,
        },
      });

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }

      return user as AdapterUser;
    },

    async deleteUser(userId: string): Promise<void> {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) {
        console.error('Error deleting user:', error);
        throw error;
      }
      return;
    },

    async linkAccount(account: AdapterAccount): Promise<AdapterAccount> {
      const { error } = await supabase.from('accounts').insert({
        ...account,
        access_token: account.access_token || undefined,
        token_type: account.token_type || undefined,
        id_token: account.id_token || undefined,
        refresh_token: account.refresh_token || undefined,
        scope: account.scope || undefined,
        expires_at: account.expires_at || undefined,
        session_state: account.session_state || undefined,
      });

      if (error) {
        console.error('Error linking account:', error);
        throw error;
      }
      return account;
    },

    async unlinkAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }): Promise<void> {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('providerAccountId', providerAccountId)
        .eq('provider', provider);

      if (error) {
        console.error('Error unlinking account:', error);
        throw error;
      }
    },

    async createSession({ sessionToken, userId, expires }: { sessionToken: string; userId: string; expires: Date }): Promise<AdapterSession> {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          sessionToken,
          userId,
          expires: expires.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        throw error;
      }

      return {
        sessionToken: data.sessionToken,
        userId: data.userId,
        expires: new Date(data.expires),
      };
    },

    async getSessionAndUser(sessionToken: string): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, user:users(*)')
        .eq('sessionToken', sessionToken)
        .single();

      if (error || !data) {
        console.error('Error getting session:', error);
        return null;
      }

      return {
        session: {
          sessionToken: data.sessionToken,
          userId: data.userId,
          expires: new Date(data.expires),
        },
        user: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          emailVerified: data.user.emailVerified ? new Date(data.user.emailVerified) : null,
          image: data.user.image,
        },
      };
    },

    async updateSession({ sessionToken, expires }: { sessionToken: string; expires?: Date }): Promise<AdapterSession | null> {
      const { data, error } = await supabase
        .from('sessions')
        .update({
          expires: expires ? expires.toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Fallback to 30 days
        })
        .eq('sessionToken', sessionToken)
        .select()
        .single();

      if (error) {
        console.error('Error updating session:', error);
        throw error;
      }

      return {
        sessionToken: data.sessionToken,
        userId: data.userId,
        expires: new Date(data.expires),
      };
    },

    async deleteSession(sessionToken: string): Promise<void> {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('sessionToken', sessionToken);

      if (error) {
        console.error('Error deleting session:', error);
        throw error;
      }
    },
  };
}

export default SupabaseAdapter;
