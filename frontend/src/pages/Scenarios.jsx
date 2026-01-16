import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import Loader from "../components/Loader.jsx";
import Navbar from "../components/Navbar.jsx";

const JOB_ROLES = [
  "Backend Engineer",
  "DevOps Engineer",
  "Site Reliability Engineer",
  "Frontend Engineer",
  "Security Engineer",
];

const Scenarios = () => {
  const [scenarios, setScenarios] = useState([]);
  const [allScenarios, setAllScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchScenarios = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedRole) params.role = selectedRole;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;

      const data = await api.getScenarios(params);
      setAllScenarios(data.scenarios);
      setScenarios(data.scenarios);
    } catch (err) {
      setError(err.message || "Failed to establish connection to uplink.");
    } finally {
      setLoading(false);
    }
  }, [selectedRole, selectedDifficulty]);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  useEffect(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) {
      setScenarios(allScenarios);
      return;
    }

    const filtered = allScenarios.filter(
      (s) =>
        s.title.toLowerCase().includes(search) ||
        s.description.toLowerCase().includes(search) ||
        s.role.toLowerCase().includes(search)
    );
    setScenarios(filtered);
  }, [searchTerm, allScenarios]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#050505]">
        <Navbar />
        <Loader />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 selection:bg-green-500/30">
      <Navbar />

      {/* Decorative Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <main className="relative container mx-auto px-6 pt-32 pb-20 max-w-7xl">
        {/* Header Section */}
        <header className="mb-12 border-l-2 border-green-500 pl-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-mono tracking-widest uppercase text-green-500/60">
              System Ready
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-4">
            SCENARIOS<span className="text-green-500">.</span>DB
          </h1>
          <p className="max-w-2xl text-zinc-500 font-mono leading-relaxed">
            Select an operational environment to begin tactical evaluation.
            Filtered by professional track and complexity vectors.
          </p>
        </header>

        {/* Filters Toolbar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-12 bg-zinc-900/30 p-4 rounded-xl border border-white/5 backdrop-blur-md">
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              placeholder="Search by title, role, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 text-white px-4 py-3 rounded-lg focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 outline-none transition-all font-mono text-sm placeholder:text-zinc-700"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setSearchTerm("");
            }}
            className="bg-zinc-950 border border-white/10 text-zinc-400 px-4 py-3 rounded-lg focus:border-green-500/50 outline-none font-mono text-sm appearance-none cursor-pointer hover:border-white/20 transition-colors"
          >
            <option value="">All Specializations</option>
            {JOB_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              setSearchTerm("");
            }}
            className="bg-zinc-950 border border-white/10 text-zinc-400 px-4 py-3 rounded-lg focus:border-green-500/50 outline-none font-mono text-sm appearance-none cursor-pointer hover:border-white/20 transition-colors"
          >
            <option value="">All Complexity Levels</option>
            <option value="easy">Level: Easy</option>
            <option value="medium">Level: Medium</option>
            <option value="hard">Level: Hard</option>
          </select>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg font-mono text-sm mb-8 flex items-center gap-3">
            <span className="text-xl">⚠️</span> {error}
          </div>
        )}

        {/* Results Grid */}
        {scenarios.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl">
            <p className="text-zinc-600 font-mono uppercase tracking-widest">
              No matching data found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {scenarios.map((scenario) => (
              <article
                key={scenario.id}
                className="group relative bg-zinc-900/20 border border-white/5 rounded-2xl p-8 hover:bg-zinc-900/40 hover:border-green-500/40 transition-all duration-500"
              >
                {/* Decorator Corner */}
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 group-hover:text-green-500 transition-opacity">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M15 3h6v6M10 14L21 3M21 21H3V3h7" />
                  </svg>
                </div>

                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <div className="flex gap-2 mb-4">
                      <span className="text-[10px] uppercase tracking-tighter font-bold px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">
                        {scenario.role}
                      </span>
                      <span
                        className={`text-[10px] uppercase tracking-tighter font-bold px-2 py-0.5 rounded border ${
                          scenario.difficulty === "easy"
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : scenario.difficulty === "medium"
                            ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }`}
                      >
                        {scenario.difficulty}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white group-hover:translate-x-1 transition-transform duration-300">
                      {scenario.title}
                    </h2>
                  </div>

                  <p className="text-zinc-500 text-sm leading-relaxed mb-8 flex-grow">
                    {scenario.description}
                  </p>

                  <Link
                    to={`/scenarios/${scenario.id}`}
                    className="group/btn relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-white px-6 py-3 font-mono font-bold text-black transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <span className="relative z-10">INITIATE MISSION</span>
                    <div className="absolute inset-0 -translate-x-full bg-green-500 transition-transform duration-300 group-hover/btn:translate-x-0" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Scenarios;
