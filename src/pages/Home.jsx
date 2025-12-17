import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';

const Home = () => {
  return (
    <div className="bg-white">
      {/* --- HERO SECTION --- */}
      <section className="relative bg-violet-50 text-white overflow-hidden">
        {/* Abstract Background Design */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 bg-amber-800 border border-amber-900 rounded-full px-4 py-1 mb-8">
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium text-gray-50">The {new Date().getFullYear()} Excellence Awards</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            <span className='text-amber-600'>Celebrate</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Greatness</span>
          </h1>
          
          <p className="mt-4 text-xl text-black max-w-2xl mx-auto mb-10">
            Celebrating excellence across every stage, screen, and industry. Your vote honors the icons of today and the legends of tomorrow.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/vote" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-full text-gray-900 bg-yellow-500 hover:bg-yellow-400 transition transform hover:scale-105 shadow-lg shadow-yellow-500/30">
              Vote Now <ArrowRight className="ml-2" size={20} />
            </Link>
            <Link to="/winners" className="inline-flex items-center justify-center px-8 py-3 border border-amber-600 text-base font-bold rounded-full text-white bg-amber-800 hover:bg-amber-600 transition">
              View Past Winners
            </Link>
          </div>
        </div>
      </section>

      {/* --- INFO SECTION --- */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-amber-900">How It Works</h2>
            <div className="w-24 h-1 bg-yellow-500 mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Browse Categories', desc: 'Explore diverse categories recognizing talent across the industry.' },
              { step: '02', title: 'Cast Your Vote', desc: 'Support your favorites. Your voice matters in deciding the winner.' },
              { step: '03', title: 'Celebrate Winners', desc: 'Join us for the grand reveal of the champions.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition ">
                <span className="absolute -right-4 -top-4 text-9xl font-bold text-gray-50 opacity-50 group-hover:text-yellow-50 transition">{item.step}</span>
                <h3 className="text-xl font-bold text-amber-900 mb-3 relative z-10">{item.title}</h3>
                <p className="text-amber-600 relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;