import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { UserProfile } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';

const tournamentSchema = z.object({
  name: z.string().min(3, 'Tournament name is required'),
  description: z.string().optional(),
  photo: z.any().optional(),
  participants: z.array(z.string()).optional(), // Array of user IDs
});

type TournamentFormData = z.infer<typeof tournamentSchema>;

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  photo: string | null;
}

interface TournamentFormProps {
  tournament?: Tournament | null;
  onSuccess: () => void;
}

const TournamentForm: React.FC<TournamentFormProps> = ({ tournament, onSuccess }) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!tournament;

  const { data: users } = useQuery<UserProfile[]>({
    queryKey: ['users-for-select'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('id, full_name').eq('role', 'user');
      if (error) throw error;
      return data;
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: tournament?.name || '',
      description: tournament?.description || '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (formData: TournamentFormData) => {
      let photoUrl: string | null = tournament?.photo || null;

      // 1. Upload photo if a new one is provided
      if (formData.photo && formData.photo.length > 0) {
        const file = formData.photo[0];
        const filePath = `tournaments/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('tournament-photos').upload(filePath, file);
        if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('tournament-photos').getPublicUrl(filePath);
        photoUrl = urlData.publicUrl;
      }

      const tournamentPayload = {
        name: formData.name,
        description: formData.description,
        photo: photoUrl,
        created_by: isEditing ? undefined : profile?.id, // Only set creator on new tournaments
      };

      // 2. Insert or update tournament
      let tournamentId: string;
      if (isEditing) {
        const { data, error } = await supabase.from('tournaments').update(tournamentPayload).eq('id', tournament.id).select().single();
        if (error) throw error;
        tournamentId = data.id;
      } else {
        const { data, error } = await supabase.from('tournaments').insert(tournamentPayload).select().single();
        if (error) throw error;
        tournamentId = data.id;
      }

      // 3. Handle participants
      if (formData.participants) {
        // First, remove existing participants if editing
        if (isEditing) {
            await supabase.from('tournament_users').delete().eq('tournament_id', tournamentId);
        }
        // Then, insert the new set of participants
        const participantRows = formData.participants.map(userId => ({
            tournament_id: tournamentId,
            user_id: userId,
        }));
        if (participantRows.length > 0) {
            await supabase.from('tournament_users').insert(participantRows);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      onSuccess();
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <input {...register('name')} placeholder="Name" className="w-full bg-black/30 p-2 rounded"/>
      {errors.name && <p className="text-red-500">{errors.name.message}</p>}

      <textarea {...register('description')} placeholder="Description" className="w-full bg-black/30 p-2 rounded"/>

      <input type="file" {...register('photo')} />

      <select multiple {...register('participants')} className="w-full bg-black/30 p-2 rounded h-40">
        {users?.map(user => <option key={user.id} value={user.id}>{user.full_name}</option>)}
      </select>

      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
};

export default TournamentForm;
