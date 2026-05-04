import { Routes, Route, NavLink } from "react-router-dom";
import { Home, History, Settings } from "lucide-react";
import HomePage from "./pages/HomePage";
import HistoryPage from "./pages/HistoryPage";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-primary-foreground flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold">FOS Report Offline</h1>
          <p className="text-xs opacity-70 mt-1">Blackshaws Road Pharmacy</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? "bg-white/15 font-semibold" : "hover:bg-white/10"
              }`
            }
          >
            <Home size={18} />
            <span>New Report</span>
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? "bg-white/15 font-semibold" : "hover:bg-white/10"
              }`
            }
          >
            <History size={18} />
            <span>History</span>
          </NavLink>
        </nav>
        <div className="p-4 text-xs opacity-50 text-center">
          v1.0.0 · All data stays on this device
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </Layout>
  );
}
