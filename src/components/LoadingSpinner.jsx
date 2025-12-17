import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Zap, ChevronDown, Award, Users, AlertTriangle, Database } from 'lucide-react';

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

export default LoadingSpinner;