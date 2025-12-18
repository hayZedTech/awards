import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Zap, ChevronDown, Award, Users, AlertTriangle, Database } from 'lucide-react';

// ⚠️ IMPORTANT: Configuration now uses Supabase keys and URL.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ; 
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ; 

// Utility function to make a secure Supabase fetch request
const supabaseFetch = async (endpoint) => {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: { 
            'Content-Type': 'application/json',
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`
        }
    });

    if (!response.ok) {
        let errorMessage = `API Error fetching ${endpoint}. Status: ${response.status}.`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            // ignore
        }
        throw new Error(errorMessage);
    }
    return response.json();
};

// Simple loading component
const LoadingSpinner = () => (
    <div className="flex flex-col justify-center items-center py-24 bg-amber-50">
        
        {/* The new, stylish spinner container */}
        <div className="relative w-24 h-24 mb-4">
            
            {/* The main spinning ring with better colors and shadow */}
            <div className="absolute inset-0 
                          animate-spin 
                          rounded-full 
                          w-full h-full 
                          border-8 border-t-8 border-b-8 
                          border-amber-700 border-t-yellow-500 border-b-green-500
                          shadow-xl shadow-yellow-500/50"
            ></div>
            
            {/* An awards icon in the center */}
            <div className="absolute inset-0 flex justify-center items-center">
                <Trophy size={32} className="text-yellow-400 animate-pulse" />
            </div>
        </div>
        
        <p className="mt-4 text-xl font-semibold text-amber-950 tracking-wider">
            Loading and Tallying Votes...
        </p>
        <p className="text-sm text-gray-700">
            A moment while we determine the winners.
        </p>
    </div>
);

/**
 * Renders the official winners page by fetching raw vote data and processing it,
 * correctly using the 'award_nominations' table for category-nominee linkage.
 */
const Winners = () => {
    const [data, setData] = useState({ 
        categories: [], 
        nominees: [], 
        nominations: [], // NEW: To link nominees to categories
        votes: [] 
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            setError(null);
            
            if (!SUPABASE_URL || !ANON_KEY) {
                setError("Configuration Error: Supabase URL or Anon Key is missing. Check environment variables.");
                setLoading(false);
                return;
            }

            try {
                // 1. Fetch Categories (award names)
                const categories = await supabaseFetch('award_categories?select=id,name');

                // 2. Fetch Nominees (candidate names)
                const nominees = await supabaseFetch('award_nominees?select=id,name');

                // 3. Fetch Nominations (the linkage table: MUST have category_id and nominee_id)
                const nominations = await supabaseFetch('award_nominations?select=id,category_id,nominee_id');

                // 4. Fetch Votes (the raw vote data: MUST have a nominee_id to tally)
                const votes = await supabaseFetch('award_votes?select=nominee_id'); 
                
                setData({ categories, nominees, nominations, votes });

            } catch (err) {
                console.error("Data Fetch Error:", err);
                setError(`Data fetch failed: ${err.message || 'Check Supabase table permissions (RLS) and names.'}`);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllData();
    }, []);

    // --- CLIENT-SIDE AGGREGATION LOGIC ---
    const results = useMemo(() => {
        if (loading || data.categories.length === 0) return []; 

        const categoryMap = new Map(data.categories.map(c => [c.id, c.name]));
        const nomineeNameMap = new Map(data.nominees.map(n => [n.id, n.name]));

        // 1. Calculate raw vote counts for every nominee ID
        const voteTally = data.votes.reduce((acc, vote) => {
            const nomineeId = vote.nominee_id;
            if (nomineeId !== undefined && nomineeId !== null) {
                acc[nomineeId] = (acc[nomineeId] || 0) + 1;
            }
            return acc;
        }, {});

        // 2. Group tallied nominees by category using the 'nominations' table
        const categorizedResults = new Map();

        data.categories.forEach(category => {
             categorizedResults.set(category.id, []);
        });

        data.nominations.forEach(nomination => {
            const nomineeId = nomination.nominee_id;
            const categoryId = nomination.category_id;
            const nomineeName = nomineeNameMap.get(nomineeId) || `Unknown Nominee (${nomineeId})`;
            const voteCount = voteTally[nomineeId] || 0;
            
            if (categorizedResults.has(categoryId)) {
                categorizedResults.get(categoryId).push({
                    id: nomination.id, 
                    name: nomineeName,
                    voteCount: voteCount,
                });
            }
        });

        // 3. Final transformation into the component's required structure
        const finalResults = Array.from(categorizedResults).map(([categoryId, nomineesTally]) => {
            
            // a. Find the maximum vote count in this category
            const maxVotes = nomineesTally.reduce((max, nom) => Math.max(max, nom.voteCount), 0);
            
            // b. Calculate Total Votes for this specific category
            const totalVotesInCategory = nomineesTally.reduce((sum, nom) => sum + nom.voteCount, 0);

            // c. Filter only nominees with votes, and sort them
            const votedNominees = nomineesTally
                .filter(nom => nom.voteCount > 0)
                .sort((a, b) => b.voteCount - a.voteCount);

            // d. Determine the winner(s)
            let winnerDetails = { name: "No Winner Yet", voteCount: 0 };
            
            if (maxVotes > 0) {
                const tiedWinners = nomineesTally.filter(nom => nom.voteCount === maxVotes);
                
                winnerDetails = {
                    name: tiedWinners.map(nom => nom.name).join(' & '),
                    voteCount: maxVotes
                };
            }
            
            return {
                categoryName: categoryMap.get(categoryId) || `Category ${categoryId}`,
                winner: winnerDetails, 
                fullTally: votedNominees,
                totalVotes: totalVotesInCategory, // Added total category votes
            };
        });

        return finalResults;

    }, [data, loading]); 

    // --- RENDER LOGIC ---

    if (loading) return <LoadingSpinner />;

    if (error) return (
        <div className="max-w-4xl mx-auto mt-12 p-6">
            <div className="bg-red-900 border border-red-400 text-red-300 px-4 py-3 rounded-xl shadow-md flex items-start gap-3">
                <AlertTriangle className="mt-1" size={24} />
                <div>
                    <strong className="font-bold">Results Processing Error:</strong>
                    <p className="text-sm">{error}</p>
                    <p className="text-xs mt-2 flex items-center"><Database size={14} className="mr-1"/> **Database Logic Check:** The application is now using the **`award_nominations`** table. Please confirm the following column names exist:</p>
                    <ul className="list-disc list-inside text-xs mt-1">
                        <li>`award_nominations` has: `category_id` and `nominee_id`</li>
                        <li>`award_votes` has: `nominee_id`</li>
                    </ul>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-amber-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="text-center mb-10">
                    <Trophy className="text-yellow-500 mx-auto mb-3" size={38} />
                    <h1 className="text-4xl font-extrabold text-amber-900 tracking-tight">
                        And The Winners Are...
                    </h1>
                    <p className="mt-2 text-xl text-yellow-600">
                        Celebrating the best across all categories.
                    </p>
                </div>

                {results.length === 0 && (
                    <div className="bg-blue-800 border-l-4 border-blue-500 text-white p-4 max-w-lg mx-auto rounded-lg">
                        <p className="font-medium">No categories or votes retrieved. Please check your Supabase data and table permissions.</p>
                    </div>
                )}
                
                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-10">
                    {results.map((item, index) => {
                        const winnerVotes = item.winner.voteCount;
                        const hasZeroVotes = item.totalVotes === 0;

                        let winnerStatus = "Winner";
                        let winnerName = item.winner.name;
                        let headerBg = "bg-amber-700";
                        let mainIcon = <Trophy className="inline mr-1" size={20} />;
                        
                        if (winnerVotes > 0) {
                            if (winnerName.includes(' & ')) {
                                winnerStatus = "TIE!";
                                headerBg = "bg-amber-700"; 
                                mainIcon = <Users className="inline mr-1" size={20} />;
                            }
                        } else {
                            winnerStatus = "Pending";
                            winnerName = "No Votes Cast";
                            headerBg = "bg-amber-700"; 
                            mainIcon = <Zap className="inline mr-1" size={20} />;
                        }
                        
                        const votedNominees = item.fullTally; 

                        return (
                            <div 
                                key={index} 
                                className="flex flex-col bg-white rounded-xl shadow-2xl shadow-amber-800 transition-all duration-300 hover:scale-[1.02]"
                            >
                                {/* Category Header */}
                                <div className={`p-4 rounded-t-xl ${headerBg} text-white`}>
                                    <h2 className="text-xl font-bold flex items-center">
                                        <Award size={24} className="mr-2" />
                                        {item.categoryName}
                                    </h2>
                                </div>
                                
                                {/* Winner / Status Body */}
                                <div className="p-5 flex-grow">
                                    <p className={`text-xl text-center font-semibold mb-1 ${hasZeroVotes ? 'text-gray-400' : 'text-amber-400'}`}>
                                        {winnerStatus}
                                    </p>
                                    <h3 className={`text-2xl font-extrabold leading-tight ${hasZeroVotes ? 'text-gray-500' : 'text-amber-950'}`}>
                                        {winnerName}
                                    </h3>
                                    <p className="mt-2 text-gray-700 text-sm">
                                        Total Category Votes: <strong className="text-black">{item.totalVotes}</strong>
                                    </p>
                                </div>

                                {/* Detailed Tally Footer */}
                                <div className="p-4 bg-amber-500 rounded-b-xl">
                                    <details className="cursor-pointer">
                                        <summary className="flex items-center justify-between font-semibold text-white hover:text-blue-200">
                                            <span>Full Vote Breakdown ({votedNominees.length} Voted Nominees)</span>
                                            <ChevronDown size={16} className="ml-2" />
                                        </summary>
                                        
                                        <ul className="mt-3 space-y-2">
                                            {votedNominees.map(nom => {
                                                const isTopResult = !hasZeroVotes && nom.voteCount === winnerVotes;
                                                return (
                                                    <li 
                                                        key={nom.id} 
                                                        className={`flex justify-between items-center p-2 rounded-lg transition-colors 
                                                            ${isTopResult ? 'bg-amber-950 border-l-4 border-amber-900' : 'bg-gray-800'}`
                                                        }
                                                    >
                                                        <span className={`text-sm ${isTopResult ? 'font-bold text-white' : 'text-gray-300'}`}>
                                                            {isTopResult ? mainIcon : null} {nom.name}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isTopResult ? 'bg-yellow-500 text-gray-900' : 'bg-gray-600 text-gray-300'}`}>
                                                            {nom.voteCount} Votes
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                            {votedNominees.length === 0 && (
                                                <p className="text-sm text-white pt-2">No nominees received votes yet.</p>
                                            )}
                                        </ul>
                                    </details>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default Winners;