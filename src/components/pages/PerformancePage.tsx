/**
 * Performance Page
 * Detailed breakdown of performance metrics
 */

import React from "react";
import { Session, SessionStats } from "../../core/session";
import { TrendingUp } from "lucide-react";

interface PerformancePageProps {
  session: Session | null;
  stats: SessionStats | null;
}

export function PerformancePage({
  session: _session,
  stats: _stats,
}: PerformancePageProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <TrendingUp size={24} />
        <h1 style={styles.title}>Performance</h1>
      </div>

      <div style={styles.content}>
        {/* Content will be added here */}
        <p style={styles.placeholder}>Performance metrics data loading...</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "24px",
    backgroundColor: "hsl(220 13% 9%)",
    overflow: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
    color: "hsl(0 0% 95%)",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    margin: 0,
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  placeholder: {
    color: "hsl(220 13% 45%)",
    fontSize: "14px",
  },
};
