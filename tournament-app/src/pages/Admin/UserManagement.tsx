import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import type { UserProfile } from '@/types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import UserForm from './UserForm';
import Dialog from '@/components/ui/Dialog';

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const { data: users, isLoading, error } = useQuery<UserProfile[], Error>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  // Placeholder mutations
  const createUserMutation = {
    mutate: (vars: Omit<UserProfile, 'id'>) => {
      console.log('Creating user:', vars);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowForm(false);
    },
    isLoading: false,
  };
  const updateUserMutation = {
    mutate: (vars: UserProfile) => {
      console.log('Updating user:', vars);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowForm(false);
      setEditingUser(null);
    },
    isLoading: false,
  };
  const deleteUserMutation = {
    mutate: (id: string) => {
      console.log('Deleting user with id:', id);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserToDelete(null);
    },
    isLoading: false,
  };

  const handleFormSubmit = (formData: Omit<UserProfile, 'id'>) => {
    if (editingUser) {
      updateUserMutation.mutate({ ...formData, id: editingUser.id });
    } else {
      createUserMutation.mutate(formData);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
  if (error) return <div className="text-red-500">Error: {error.message}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-primary">User Management</h1>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowForm(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Add User</span>
        </button>
      </div>

      <div className="bg-brand-surface shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-brand-border">
          <thead className="bg-brand-hover">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-secondary uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-secondary uppercase tracking-wider">Role</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-brand-hover transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-brand-primary">{user.full_name}</div>
                  <div className="text-sm text-brand-secondary">{user.username}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-secondary">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-4">
                    <button onClick={() => { setEditingUser(user); setShowForm(true); }} className="text-indigo-400 hover:text-indigo-300">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => setUserToDelete(user)} className="text-red-500 hover:text-red-400">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingUser ? 'Edit User' : 'Add New User'}
      >
        <UserForm
          onSubmit={handleFormSubmit}
          initialData={editingUser}
          isLoading={createUserMutation.isLoading || updateUserMutation.isLoading}
        />
      </Dialog>

      {userToDelete && (
        <ConfirmationModal
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={() => deleteUserMutation.mutate(userToDelete.id)}
          title="Delete User"
          message={`Are you sure you want to delete ${userToDelete.username}? This action cannot be undone.`}
          confirmText="Delete"
          variant="destructive"
        />
      )}
    </div>
  );
};

export default UserManagement;
