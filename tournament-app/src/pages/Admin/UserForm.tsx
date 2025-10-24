import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { UserProfile } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';

// Zod schema for validation
const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  full_name: z.string().min(2, 'Full name is required'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  role: z.enum(['admin', 'user'], { required_error: 'Role is required' }),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  user?: UserProfile | null;
  onSuccess: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSuccess }) => {
  const { profile: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!user;

  const { register, handleSubmit, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: user?.username || '',
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      role: user?.role === 'admin' ? 'admin' : 'user',
    },
  });

  const createOrUpdateUser = async (formData: UserFormData) => {
    if (isEditing) {
      // Update logic
      const { data, error } = await supabase
        .from('users')
        .update({ ...formData, password: undefined }) // Don't update password for now
        .eq('id', user.id);
      if (error) throw error;
      return data;
    } else {
      // Create logic using the edge function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: formData,
      });
      if (error) throw new Error(error.message);
      return data;
    }
  };

  const mutation = useMutation({
    mutationFn: createOrUpdateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess();
    },
    onError: (error) => {
      // Basic error handling, can be improved with toasts
      alert(`Error: ${error.message}`);
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (isEditing && !data.password) {
      delete data.password; // Don't send empty password on edit
    }
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="username" className="block mb-1 text-sm font-medium">Username</label>
        <input id="username" {...register('username')} className="w-full bg-black/30 border border-brand-border p-2 rounded-lg" />
        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
      </div>
      <div>
        <label htmlFor="full_name" className="block mb-1 text-sm font-medium">Full Name</label>
        <input id="full_name" {...register('full_name')} className="w-full bg-black/30 border border-brand-border p-2 rounded-lg" />
        {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
      </div>
      <div>
        <label htmlFor="phone" className="block mb-1 text-sm font-medium">Phone</label>
        <input id="phone" {...register('phone')} className="w-full bg-black/30 border border-brand-border p-2 rounded-lg" />
      </div>
      <div>
        <label htmlFor="password" className="block mb-1 text-sm font-medium">{isEditing ? 'New Password (optional)' : 'Password'}</label>
        <input id="password" type="password" {...register('password')} className="w-full bg-black/30 border border-brand-border p-2 rounded-lg" />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>
      <div>
        <label htmlFor="role" className="block mb-1 text-sm font-medium">Role</label>
        <select id="role" {...register('role')} className="w-full bg-black/30 border border-brand-border p-2 rounded-lg" disabled={currentUser?.role !== 'developer'}>
          {currentUser?.role === 'developer' && <option value="admin">Admin</option>}
          <option value="user">User</option>
        </select>
        {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
      </div>
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-brand-primary text-brand-background font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
