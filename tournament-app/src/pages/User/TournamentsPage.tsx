import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  photo: string | null;
}

const TournamentsPage: React.FC = () => {
    const { data: tournaments, isLoading, error } = useQuery<Tournament[]>({
        queryKey: ['tournaments-user-view'],
        queryFn: async () => {
            const { data, error } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
        },
    });

    if (isLoading) return <div>Loading tournaments...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Tournaments</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments?.map((tournament) => (
                    <div key={tournament.id} className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-lg">
                        <img src={tournament.photo || `https://placehold.co/600x400/1a202c/ffffff?text=${tournament.name.replace(/\s+/g, '+')}`} alt={tournament.name} className="w-full h-48 object-cover" />
                        <div className="p-5">
                            <h2 className="text-xl font-bold text-white mb-2">{tournament.name}</h2>
                            <p className="text-gray-400 text-sm line-clamp-2">{tournament.description}</p>
                            {/* In a future step, a "View Details" button would lead to the matches page for this tournament */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TournamentsPage;
