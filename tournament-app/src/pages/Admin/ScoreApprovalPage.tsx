import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { Check, X } from 'lucide-react';

interface PendingMatch {
  id: string;
  player1: { full_name: string };
  player2: { full_name: string };
  reported_score1: number;
  reported_score2: number;
  reporter: { full_name: string };
}

const ScoreApprovalPage: React.FC = () => {
    const queryClient = useQueryClient();

    const { data: pendingMatches, isLoading, error } = useQuery<PendingMatch[]>({
        queryKey: ['pending-matches'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('matches')
                .select('*, player1:users!matches_player1_id_fkey(full_name), player2:users!matches_player2_id_fkey(full_name), reporter:users!matches_reporter_id_fkey(full_name)')
                .eq('report_status', 'pending');
            if (error) throw error;
            return data;
        },
    });

    const approveScoreMutation = useMutation({
        mutationFn: async (match: PendingMatch) => {
            // In a real app, this should be a transaction or an RPC call to also update standings
            const { error } = await supabase.from('matches').update({
                score1: match.reported_score1,
                score2: match.reported_score2,
                report_status: 'confirmed',
                status: 'finished', // Mark the match as finished
            }).eq('id', match.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-matches'] });
            queryClient.invalidateQueries({ queryKey: ['matches'] }); // Invalidate general matches list too
        },
        onError: (error) => alert(`Error: ${error.message}`),
    });

    const rejectScoreMutation = useMutation({
         mutationFn: async (matchId: string) => {
            const { error } = await supabase.from('matches').update({
                report_status: 'rejected',
            }).eq('id', matchId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-matches'] });
        },
        onError: (error) => alert(`Error: ${error.message}`),
    });


    if (isLoading) return <div>Loading pending score reports...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Score Approval</h1>
            <div className="space-y-4">
                {pendingMatches?.length === 0 && <p>No pending score reports.</p>}
                {pendingMatches?.map(match => (
                    <div key={match.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{match.player1.full_name} vs {match.player2.full_name}</p>
                            <p>Reported Score: {match.reported_score1} - {match.reported_score2}</p>
                            <p className="text-sm text-gray-400">Reported by: {match.reporter.full_name}</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => approveScoreMutation.mutate(match)} className="text-green-500 hover:text-green-400"><Check /></button>
                            <button onClick={() => rejectScoreMutation.mutate(match.id)} className="text-red-500 hover:text-red-400"><X /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScoreApprovalPage;
