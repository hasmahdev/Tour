import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { UserProfile } from '@/types';

const formSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  full_name: z.string().min(3, 'Full name must be at least 3 characters'),
  password: z.string().optional(),
  role: z.enum(['admin', 'user']),
});

type UserFormData = z.infer<typeof formSchema>;

interface UserFormProps {
  onSubmit: (data: UserFormData) => void;
  initialData?: UserProfile | null;
  isLoading: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ onSubmit, initialData, isLoading }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        role: initialData.role === 'developer' ? 'admin' : initialData.role,
      });
    } else {
      reset({
        username: '',
        full_name: '',
        password: '',
        role: 'user',
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-brand-secondary">
          Username
        </label>
        <input
          id="username"
          {...register('username')}
          className="mt-1 block w-full bg-brand-surface border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-primary focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        {errors.username && <p className="mt-2 text-sm text-red-600">{errors.username.message}</p>}
      </div>
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-brand-secondary">
          Full Name
        </label>
        <input
          id="full_name"
          {...register('full_name')}
          className="mt-1 block w-full bg-brand-surface border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-primary focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        {errors.full_name && <p className="mt-2 text-sm text-red-600">{errors.full_name.message}</p>}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-brand-secondary">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className="mt-1 block w-full bg-brand-surface border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-primary focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>}
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-brand-secondary">
          Role
        </label>
        <select
          id="role"
          {...register('role')}
          className="mt-1 block w-full bg-brand-surface border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-primary focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        {errors.role && <p className="mt-2 text-sm text-red-600">{errors.role.message}</p>}
      </div>
      <div className="flex justify-end gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save User'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
