import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { UserProfile } from '../../api/auth';
// import UserForm from './UserForm'; // To be created
// import Dialog from '../../components/ui/Dialog';
// import ConfirmationModal from '../../components/ui/ConfirmationModal'; // To be created
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
            // Developers get all users, Admins get only 'user' role
            let query = supabase.from('users').select('*');
            if (profile?.role === 'admin') {
                query = query.eq('role', 'user');
            }
            const { data, error } = await query;
            if (error) throw new Error(error.message);
            return data;
        },
        enabled: !!profile, // Only run query if user profile is loaded
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
        // Delete mutation logic will go here
        console.log(`Deleting user ${deletingUserId}`);
        setIsConfirmOpen(false);
        setDeletingUserId(null);
    };

    if (isLoading) return <div>Loading users...</div>;
    if (error) return <div>Error loading users: {error.message}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">User Management</h1>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-brand-primary text-brand-background font-bold py-2.5 px-5 rounded-lg hover:bg-opacity-90 transition-all"
                >
                    <Plus size={20} />
                    <span>Add User</span>
                </button>
            </div>

            <div className="bg-black/20 border border-brand-border rounded-20 p-5">
                <table className="w-full text-left">
                    <thead>
                        <tr>
                            <th className="p-4">Full Name</th>
                            <th className="p-4">Username</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users?.map((user) => (
                            <tr key={user.id} className="border-b border-brand-border last:border-b-0">
                                <td className="p-4">{user.full_name}</td>
                                <td className="p-4">{user.username}</td>
                                <td className="p-4">{user.role}</td>
                                <td className="p-4 flex gap-4">
                                    <button onClick={() => openEditModal(user)} className="text-brand-secondary hover:text-brand-primary"><Edit size={18} /></button>
                                    <button onClick={() => openDeleteConfirm(user.id)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/*
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
            */}
        </div>
    );
};

// I need to update App.tsx to use this component for the /users route.
// But first, let's create the form.

// For now, I'll just rename the placeholder file.
// The actual component will be created in the next step.
// This is just to satisfy the import.
const UsersPage = UserManagement;
export default UsersPage;
