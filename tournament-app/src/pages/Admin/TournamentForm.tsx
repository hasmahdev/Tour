import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import type { UserProfile } from '@/types';

const formSchema = z.object({
  name: z.string().min(3, 'Tournament name must be at least 3 characters'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  participant_ids: z.array(z.string()).optional(),
});

type TournamentFormData = z.infer<typeof formSchema>;

interface TournamentFormProps {
  onSubmit: (data: TournamentFormData) => void;
  initialData?: TournamentFormData;
  isLoading: boolean;
}

const fetchUsers = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase.from('users').select('id, full_name, username, role');
  if (error) throw new Error(error.message);
  return data;
};

const TournamentForm: React.FC<TournamentFormProps> = ({ onSubmit, initialData, isLoading }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TournamentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<UserProfile[], Error>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-brand-secondary">
          Tournament Name
        </label>
        <input
          id="name"
          {...register('name')}
          className="mt-1 block w-full bg-brand-surface border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-primary focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-brand-secondary">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={4}
          className="mt-1 block w-full bg-brand-surface border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-primary focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-brand-secondary">
            Start Date
          </label>
          <input
            id="start_date"
            type="date"
            {...register('start_date')}
            className="mt-1 block w-full bg-brand-surface border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-primary focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.start_date && <p className="mt-2 text-sm text-red-600">{errors.start_date.message}</p>}
        </div>
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-brand-secondary">
            End Date
          </label>
          <input
            id="end_date"
            type="date"
            {...register('end_date')}
            className="mt-1 block w-full bg-brand-surface border border-brand-border rounded-md shadow-sm py-2 px-3 text-brand-primary focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.end_date && <p className="mt-2 text-sm text-red-600">{errors.end_date.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-secondary">Participants</label>
        {isLoadingUsers ? (
          <p>Loading users...</p>
        ) : (
          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto p-2 rounded-md border border-brand-border">
            {users?.map((user) => (
              <div key={user.id} className="flex items-center">
                <input
                  id={`user-${user.id}`}
                  type="checkbox"
                  value={user.id}
                  {...register('participant_ids')}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor={`user-${user.id}`} className="ml-3 text-sm text-brand-primary">
                  {user.full_name} (@{user.username})
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          // onClick={onCancel}
          className="py-2 px-4 bg-brand-surface hover:bg-brand-hover text-brand-primary font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Tournament'}
        </button>
      </div>
    </form>
  );
};

export default TournamentForm;
