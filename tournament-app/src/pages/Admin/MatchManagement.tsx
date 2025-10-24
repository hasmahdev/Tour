import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { Plus } from 'lucide-react';

interface Match {
  id: string;
  player1_id: string;
  player2_id: string;
  score1: number;
  score2: number;
  status: string;
  users: { full_name: string }[]; // Simplified for display
}

const MatchManagement: React.FC = () => {
    const { data: matches, isLoading, error } = useQuery<Match[]>({
        queryKey: ['matches'],
        queryFn: async () => {
            // This query is a bit complex to get player names.
            // A database view or more targeted RPC could optimize this.
            const { data, error } = await supabase
                .from('matches')
                .select('*, player1:users!matches_player1_id_fkey(full_name), player2:users!matches_player2_id_fkey(full_name)');
            if (error) throw new Error(error.message);
            return data;
        },
    });

    if (isLoading) return <div>Loading matches...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Match Management</h1>
                 <button
                    className="flex items-center gap-2 bg-white text-gray-900 font-bold py-2.5 px-5 rounded-lg hover:bg-gray-200 transition-all"
                >
                    <Plus size={20} />
                    <span>Create Match</span>
                </button>
            </div>

             <div className="bg-gray-800 border border-gray-700 rounded-2xl p-1">
                <table className="w-full text-left">
                     <thead className="border-b border-gray-700">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-gray-400">Player 1</th>
                            <th className="p-4 text-sm font-semibold text-gray-400">Player 2</th>
                            <th className="p-4 text-sm font-semibold text-gray-400">Score</th>
                            <th className="p-4 text-sm font-semibold text-gray-400">Status</th>
                            <th className="p-4 text-sm font-semibold text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matches?.map((match: any) => (
                            <tr key={match.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                                <td className="p-4 text-white">{match.player1.full_name}</td>
                                <td className="p-4 text-white">{match.player2.full_name}</td>
                                <td className="p-4 text-gray-300">{match.score1} - {match.score2}</td>
                                <td className="p-4 text-gray-300 capitalize">{match.status}</td>
                                <td className="p-4">
                                    {/* Action buttons will go here */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MatchManagement;
