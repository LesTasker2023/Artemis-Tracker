import React, { useState, useEffect } from "react";
import { Session, SessionStats } from "../../core/session";
import { Loadout } from "../../core/loadout";
import Sidebar from "./Sidebar";
import MainContent from "./MainContent";
import DetailPanel from "./DetailPanel";

interface ActiveSessionDashboardProps {
  session: Session | null;
  stats: SessionStats | null;
  activeLoadout: Loadout | null;
  onNavigateToPage?: (page: string) => void;
}

const DEFAULT_HERO_STATS: [string, string, string] = [
  "Return Rate",
  "Profit/Loss",
  "Total Kills",
];

const ActiveSessionDashboard: React.FC<ActiveSessionDashboardProps> = ({
  session,
  stats,
  activeLoadout,
  onNavigateToPage,
}) => {
  const [applyMarkup, setApplyMarkup] = useState(false);
  const [applyAdditionalExpenses, setApplyAdditionalExpenses] = useState(false);
  const [heroStats, setHeroStats] =
    useState<[string, string, string]>(DEFAULT_HERO_STATS);

  // Load hero stats from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("artemis-hero-stats");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 3) {
          setHeroStats(parsed as [string, string, string]);
        }
      } catch (e) {
        console.error("Failed to load hero stats:", e);
      }
    }
  }, []);

  // Save hero stats to localStorage when changed
  const handleHeroStatsChange = (newStats: [string, string, string]) => {
    setHeroStats(newStats);
    localStorage.setItem("artemis-hero-stats", JSON.stringify(newStats));
  };

  return (
    <div style={styles.container}>
      {/* Sidebar - 220px */}
      <Sidebar
        session={session}
        loadout={activeLoadout}
        applyMarkup={applyMarkup}
        setApplyMarkup={setApplyMarkup}
        applyAdditionalExpenses={applyAdditionalExpenses}
        setApplyAdditionalExpenses={setApplyAdditionalExpenses}
      />

      {/* Main Content - Flexible */}
      <MainContent
        session={session}
        stats={stats}
        loadout={activeLoadout}
        applyMarkup={applyMarkup}
        applyAdditionalExpenses={applyAdditionalExpenses}
        heroStats={heroStats}
        onHeroStatsChange={handleHeroStatsChange}
        onNavigateToPage={onNavigateToPage}
      />

      {/* Detail Panel - 360px */}
      <DetailPanel session={session} />
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100%",
    backgroundColor: "hsl(220 13% 9%)",
  },
};

export default ActiveSessionDashboard;
