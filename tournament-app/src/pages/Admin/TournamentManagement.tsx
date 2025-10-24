import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Dialog from '../../components/ui/Dialog';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import TournamentForm from './TournamentForm';

// Define the Tournament type based on our DB schema
interface Tournament {
  id: string;
  name: string;
  description: string | null;
  photo: string | null;
  created_at: string;
}

const TournamentManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingTournamentId, setDeletingTournamentId] = useState<string | null>(null);

    const { data: tournaments, isLoading, error } = useQuery<Tournament[]>({
        queryKey: ['tournaments'],
        queryFn: async () => {
            const { data, error } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (tournamentId: string) => {
            const { error } = await supabase.from('tournaments').delete().eq('id', tournamentId);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
            setIsConfirmOpen(false);
        },
        onError: (error) => {
            alert(`Error: ${error.message}`);
        }
    });

    const openCreateModal = () => {
        setEditingTournament(null);
        setIsFormOpen(true);
    };

    const openEditModal = (tournament: Tournament) => {
        setEditingTournament(tournament);
        setIsFormOpen(true);
    }

    const openDeleteConfirm = (id: string) => {
        setDeletingTournamentId(id);
        setIsConfirmOpen(true);
    }

    const handleConfirmDelete = () => {
        if (!deletingTournamentId) return;
        deleteMutation.mutate(deletingTournamentId);
    };

    if (isLoading) return <div>Loading tournaments...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Tournament Management</h1>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-white text-gray-900 font-bold py-2.5 px-5 rounded-lg hover:bg-gray-200 transition-all"
                >
                    <Plus size={20} />
                    <span>Create Tournament</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments?.map((tournament) => (
                    <div key={tournament.id} className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-lg hover:-translate-y-1 transition-transform">
                        <img src={tournament.photo || `https://placehold.co/600x400/1a202c/ffffff?text=${tournament.name.replace(/\s+/g, '+')}`} alt={tournament.name} className="w-full h-48 object-cover" />
                        <div className="p-5">
                            <h2 className="text-xl font-bold text-white mb-2">{tournament.name}</h2>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{tournament.description}</p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => openEditModal(tournament)} className="text-gray-400 hover:text-white"><Edit size={18} /></button>
                                <button onClick={() => openDeleteConfirm(tournament.id)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingTournament ? 'Edit Tournament' : 'Create Tournament'}>
                <TournamentForm tournament={editingTournament} onSuccess={() => setIsFormOpen(false)} />
            </Dialog>
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                message="Are you sure you want to delete this tournament?"
            />
        </div>
    );
};

export default TournamentManagement;
