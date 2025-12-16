import React from 'react';
import { ThumbsUp, CheckCircle } from 'lucide-react';

const NomineeCard = ({ nominee, categoryId, hasVoted, onVote }) => {
  // nominee prop should have: id, name, image (optional), description (optional)
  
  return (
    <div className={`relative group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 overflow-hidden
      ${hasVoted ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-100 hover:border-yellow-400'}`}
    >
      {/* Optional: Placeholder Image Area if you add images later */}
      <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <span className="text-4xl">🏆</span>
      </div>

      <div className="p-5 text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-2">
          {nominee.name}
        </h3>
        <p className="text-xs text-gray-500 mb-4 uppercase tracking-widest">Nominee</p>

        <button
          onClick={() => onVote(nominee.id, categoryId)}
          disabled={hasVoted}
          className={`w-full py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200
            ${hasVoted 
              ? 'bg-green-100 text-green-700 cursor-default' 
              : 'bg-gray-900 text-white hover:bg-yellow-500 hover:text-gray-900'
            }`}
        >
          {hasVoted ? (
            <>
              <CheckCircle size={18} /> Voted
            </>
          ) : (
            <>
              <ThumbsUp size={18} /> Vote
            </>
          )}
        </button>
      </div>

      {/* Ribbon for Winner (Optional logic for later) */}
      {/* <div className="absolute top-0 right-0 bg-yellow-500 text-xs font-bold px-2 py-1 text-black rounded-bl-lg">
        Leading
      </div> */}
    </div>
  );
};

export default NomineeCard;