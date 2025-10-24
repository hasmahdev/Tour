import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { UserProfile } from '../../api/auth';
import UserForm from './UserForm';
import Dialog from '../../components/ui/Dialog';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const UserManagement: React.FC = () => {
    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

    const { data: users, isLoading, error } = useQuery<UserProfile[]>({
        queryKey: ['users'],
        queryFn: async () => {
            let query = supabase.from('users').select('*');
            if (profile?.role === 'admin') {
                query = query.eq('role', 'user');
            }
            const { data, error } = await query;
            if (error) throw new Error(error.message);
            return data;
        },
        enabled: !!profile,
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            const { error } = await supabase.from('users').delete().eq('id', userId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsConfirmOpen(false);
            setDeletingUserId(null);
        },
        onError: (error) => {
            alert(`Error deleting user: ${error.message}`);
            setIsConfirmOpen(false);
        }
    });

    const openCreateModal = () => {
        setEditingUser(null);
        setIsFormOpen(true);
    };

    const openEditModal = (user: UserProfile) => {
        setEditingUser(user);
        setIsFormOpen(true);
    };

    const openDeleteConfirm = (userId: string) => {
        setDeletingUserId(userId);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!deletingUserId) return;
        deleteUserMutation.mutate(deletingUserId);
    };

    if (isLoading) return <div>Loading users...</div>;
    if (error) return <div>Error loading users: {error.message}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">User Management</h1>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-white text-gray-900 font-bold py-2.5 px-5 rounded-lg hover:bg-gray-200 transition-all"
                >
                    <Plus size={20} />
                    <span>Add User</span>
                </button>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-1">
                <table className="w-full text-left">
                    <thead className="border-b border-gray-700">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-gray-400">Full Name</th>
                            <th className="p-4 text-sm font-semibold text-gray-400">Username</th>
                            <th className="p-4 text-sm font-semibold text-gray-400">Role</th>
                            <th className="p-4 text-sm font-semibold text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users?.map((user) => (
                            <tr key={user.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                                <td className="p-4 text-white">{user.full_name}</td>
                                <td className="p-4 text-gray-300">{user.username}</td>
                                <td className="p-4 text-gray-300 capitalize">{user.role}</td>
                                <td className="p-4 flex gap-4">
                                    <button onClick={() => openEditModal(user)} className="text-gray-400 hover:text-white"><Edit size={18} /></button>
                                    <button onClick={() => openDeleteConfirm(user.id)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingUser ? 'Edit User' : 'Add User'}>
                <UserForm user={editingUser} onSuccess={() => setIsFormOpen(false)} />
            </Dialog>

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                message="Are you sure you want to delete this user? This action cannot be undone."
            />
        </div>
    );
};

export default UserManagement;
