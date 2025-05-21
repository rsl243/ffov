'use client';

import { useState } from 'react';
import { User, UserRole } from '@/types/user';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { UserForm } from './UserForm';

interface UserManagerProps {
  users: User[];
  onAddUser: (data: { email: string; role: UserRole; name: string }) => Promise<void>;
  onUpdateUser: (userId: string, data: Partial<User>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  subscriptionType: 'VILLE' | 'REGION' | 'PAYS';
}

export function UserManager({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  subscriptionType,
}: UserManagerProps) {
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const roles = {
    ADMIN: 'Administrateur',
    MANAGER: 'Manager',
    USER: 'Utilisateur',
  };

  const canAddUsers = subscriptionType !== 'VILLE' || users.length < 3;

  const handleAddUser = async (data: Partial<User>) => {
    try {
      setIsLoading(true);
      await onAddUser(data as { email: string; role: UserRole; name: string });
      setShowAddUserDialog(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (data: Partial<User>) => {
    if (!editingUser) return;
    try {
      setIsLoading(true);
      await onUpdateUser(editingUser.id, data);
      setEditingUser(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
          <p className="text-gray-500">
            {subscriptionType === 'VILLE'
              ? 'Limité à 3 utilisateurs'
              : 'Gestion hiérarchique des utilisateurs'}
          </p>
        </div>
        <Button
          onClick={() => setShowAddUserDialog(true)}
          disabled={!canAddUsers}
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un utilisateur
        </Button>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{roles[user.role as keyof typeof roles]}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      user.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {user.active ? 'Actif' : 'En attente'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingUser(user)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog d'ajout d'utilisateur */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
            <DialogDescription>
              Invitez un nouveau membre à rejoindre votre organisation.
            </DialogDescription>
          </DialogHeader>
          <UserForm
            onSubmit={handleAddUser}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de modification d'utilisateur */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'utilisateur.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <UserForm
              user={editingUser}
              onSubmit={handleUpdateUser}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
