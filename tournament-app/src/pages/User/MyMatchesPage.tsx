import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Edit } from 'lucide-react';
import Dialog from '../../components/ui/Dialog';

interface Match {
  id: string;
  player1: { full_name: string };
  player2: { full_name: string };
  score1: number;
  score2: number;
  status: string;
  report_status: string;
}

const MyMatchesPage: React.FC = () => {
    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const [isReportingModalOpen, setIsReportingModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [score1, setScore1] = useState(0);
    const [score2, setScore2] = useState(0);

    const { data: matches, isLoading, error } = useQuery<Match[]>({
        queryKey: ['my-matches', profile?.id],
        queryFn: async () => {
            if (!profile) return [];
            const { data, error } = await supabase
                .from('matches')
                .select('*, player1:users!matches_player1_id_fkey(full_name), player2:users!matches_player2_id_fkey(full_name)')
                .or(`player1_id.eq.${profile.id},player2_id.eq.${profile.id}`);
            if (error) throw error;
            return data;
        },
        enabled: !!profile,
    });

    const reportScoreMutation = useMutation({
        mutationFn: async ({ matchId, score1, score2 }: { matchId: string, score1: number, score2: number }) => {
            const { error } = await supabase.from('matches').update({
                reported_score1: score1,
                reported_score2: score2,
                reporter_id: profile?.id,
                report_status: 'pending',
                reported_at: new Date().toISOString(),
            }).eq('id', matchId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-matches'] });
            setIsReportingModalOpen(false);
        },
        onError: (error) => alert(`Error: ${error.message}`),
    });

    const openReportModal = (match: Match) => {
        setSelectedMatch(match);
        setScore1(match.score1);
        setScore2(match.score2);
        setIsReportingModalOpen(true);
    };

    const handleReportSubmit = () => {
        if (!selectedMatch) return;
        reportScoreMutation.mutate({ matchId: selectedMatch.id, score1, score2 });
    };

    if (isLoading) return <div>Loading your matches...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">My Matches</h1>
            {matches?.map(match => (
                <div key={match.id} className="bg-gray-800 p-4 rounded-lg mb-4 flex justify-between items-center">
                    <div>
                        <p>{match.player1.full_name} vs {match.player2.full_name}</p>
                        <p>Score: {match.score1} - {match.score2}</p>
                        <p>Status: {match.status} | Report: {match.report_status}</p>
                    </div>
                    {match.status !== 'finished' && (
                        <button onClick={() => openReportModal(match)} className="text-gray-400 hover:text-white"><Edit size={18} /></button>
                    )}
                </div>
            ))}
            <Dialog isOpen={isReportingModalOpen} onClose={() => setIsReportingModalOpen(false)} title="Report Score">
                <h3>{selectedMatch?.player1.full_name} vs {selectedMatch?.player2.full_name}</h3>
                <input type="number" value={score1} onChange={e => setScore1(parseInt(e.target.value))} />
                <input type="number" value={score2} onChange={e => setScore2(parseInt(e.target.value))} />
                <button onClick={handleReportSubmit}>Submit Report</button>
            </Dialog>
        </div>
    );
};

export default MyMatchesPage;
