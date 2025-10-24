import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import Dialog from '@/components/ui/Dialog';
import TournamentForm from './TournamentForm';

interface Tournament {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  participant_ids?: string[];
}

const TournamentManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

  const { data: tournaments, isLoading, error } = useQuery<Tournament[], Error>({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tournaments').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const handleEdit = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingTournament(null);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingTournament(null);
    // In a real app, you'd invalidate the query here
  };

  if (isLoading) return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
  if (error) return <div className="text-red-500">Error fetching tournaments: {error.message}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-primary">Tournaments</h1>
        <button
          onClick={handleAddNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Add Tournament</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments?.map((tournament) => (
          <div key={tournament.id} className="bg-brand-surface rounded-lg shadow-md p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-brand-primary mb-2">{tournament.name}</h2>
              <p className="text-brand-secondary text-sm mb-4">{tournament.description}</p>
            </div>
            <div className="flex justify-end gap-4 mt-4">
              <button onClick={() => handleEdit(tournament)} className="text-indigo-400 hover:text-indigo-300">
                <Edit size={18} />
              </button>
              <button className="text-red-500 hover:text-red-400">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingTournament ? 'Edit Tournament' : 'Add New Tournament'}
      >
        <TournamentForm
          initialData={editingTournament || undefined}
          onSubmit={handleFormSuccess}
          isLoading={false} // Placeholder
        />
      </Dialog>
    </div>
  );
};

export default TournamentManagement;
