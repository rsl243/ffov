"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useOrganization } from '@/hooks/useOrganization';
import { UserManager } from '@/components/users/UserManager';
import { User, UserRole } from '@/types/user';
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/services/user';
import { toast } from '@/components/ui/use-toast';

export default function UtilisateursPage() {
  const { data: session } = useSession();
  const { organization } = useOrganization();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de charger la liste des utilisateurs.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      loadUsers();
    }
  }, [session]);

  const handleAddUser = async (data: { email: string; role: UserRole; name: string }) => {
    try {
      const newUser = await createUser(data);
      setUsers([...users, newUser]);
      toast({
        title: 'Succès',
        description: 'L\'utilisateur a été ajouté avec succès.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible d\'ajouter l\'utilisateur.',
      });
      throw error;
    }
  };

  const handleUpdateUser = async (userId: string, data: Partial<User>) => {
    try {
      const updatedUser = await updateUser(userId, data);
      setUsers(users.map(user => user.id === userId ? updatedUser : user));
      toast({
        title: 'Succès',
        description: 'L\'utilisateur a été mis à jour avec succès.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de mettre à jour l\'utilisateur.',
      });
      throw error;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
      toast({
        title: 'Succès',
        description: 'L\'utilisateur a été supprimé avec succès.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer l\'utilisateur.',
      });
    }
  };

  if (!session || !organization) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <UserManager
        users={users}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
        subscriptionType={organization.subscriptionType as 'VILLE' | 'REGION' | 'PAYS'}
      />
    </div>
  );
}