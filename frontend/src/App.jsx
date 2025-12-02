import Squares from './components/common/Squares';
import CampusTitle from './components/common/CampusTitle';
import './App.css';

// Lucide React icons (we'll use emojis as placeholders since we don't have lucide-react installed)
const GraduationCap = () => <span className="text-4xl">🎓</span>;
const Briefcase = () => <span className="text-4xl">💼</span>;
const Shield = () => <span className="text-4xl">🛡️</span>;
const Users = () => <span className="text-4xl">👥</span>;
const ArrowRight = ({ className }) => <span className={className}>→</span>;

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Animated Squares Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <Squares 
          speed={0.3} 
          squareSize={50}
          direction='diagonal'
          borderColor='rgba(59, 130, 246, 0.2)'
          hoverFillColor='rgba(59, 130, 246, 0.08)'
        />
      </div>
      
      {/* Content wrapper with higher z-index */}
      <div className="relative" style={{ zIndex: 1 }}>
        {/* Hero Section - Only Title and Motto */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="text-center relative z-10">
            <CampusTitle />
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-slate-300">
              A unified platform for Students, Recruiters, and TPO teams to connect and manage placements.
            </p>

            {/* Role Selection Cards */}
            <div className="mt-16">
              <h2 className="text-2xl font-semibold text-white mb-8">Choose Your Role</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {/* Student Card */}
                <a 
                  href="/login?role=student" 
                  className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-blue-500 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                      <GraduationCap />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Student</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Discover jobs, apply, and track your placement journey
                    </p>
                    <div className="flex items-center text-blue-400 text-sm font-medium group-hover:gap-2 transition-all">
                      Get Started
                      <ArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </a>

                {/* Recruiter Card */}
                <a 
                  href="/login?role=recruiter" 
                  className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-green-500 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/20"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                      <Briefcase />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Recruiter</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Post jobs, review applications, and hire top talent
                    </p>
                    <div className="flex items-center text-green-400 text-sm font-medium group-hover:gap-2 transition-all">
                      Get Started
                      <ArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </a>

                {/* TPO Admin Card */}
                <a 
                  href="/login?role=tpo-admin" 
                  className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-purple-500 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                      <Shield />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">TPO Admin</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Manage placements, approve jobs, and oversee operations
                    </p>
                    <div className="flex items-center text-purple-400 text-sm font-medium group-hover:gap-2 transition-all">
                      Get Started
                      <ArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </a>

                {/* TPO Dept Card */}
                <a 
                  href="/login?role=tpo-dept" 
                  className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-orange-500 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/20"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                      <Users />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">TPO Dept</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Verify profiles, review applications, and support students
                    </p>
                    <div className="flex items-center text-orange-400 text-sm font-medium group-hover:gap-2 transition-all">
                      Get Started
                      <ArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </a>
              </div>

              {/* Register Link */}
              <div className="mt-8 text-slate-400">
                Don't have an account? 
                <a href="/register" className="text-blue-400 hover:text-blue-300 ml-2 font-medium">
                  Register here
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
