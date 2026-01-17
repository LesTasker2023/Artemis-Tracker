/**
 * LoadingScreen - Shown during app initialization
 * Displays Artemis logo and loading progress with Vanta fog background
 */

import { useState, useEffect, useRef } from "react";
import projectLogo from "../../data/artemis logo.png";
import { colors } from "./ui";

interface LoadingScreenProps {
  message?: string;
  progress?: number;
  fadingOut?: boolean;
}

const wittyMessages = [
  // Monty Python
  "He's not the Messiah, he's a very naughty boy!",
  "Run away! Run away!",
  "Ni!",
  "It's just a flesh wound",
  "What is your quest?",
  "Bring out your dead!",
  // Hitchhiker's Guide
  "Don't panic",
  "The answer is 42",
  "So long, and thanks for all the fish",
  "This must be Thursday",
  // Red Dwarf
  "Smoke me a kipper, I'll be back for breakfast",
  "Better than life",
  // Firefly
  "Shiny",
  "I'll be in my bunk",
  // The Prisoner
  "I am not a number",
  // Battlestar Galactica
  "So say we all",
  // Quantum Leap
  "Oh boy",
  // Twilight Zone
  "Submitted for your approval",
  // Doctor Who
  "Allons-y!",
  "I'm sorry, I'm so sorry",
  // The Outer Limits
  "There is nothing wrong with your television",
];

export function LoadingScreen({ message, fadingOut }: LoadingScreenProps) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    // Only rotate messages if no specific message is provided
    if (!message) {
      const interval = setInterval(() => {
        setCurrentMessage((prev) => (prev + 1) % wittyMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [message]);

  // Initialize Vanta fog effect (scripts preloaded in index.html)
  useEffect(() => {
    // Initialize Vanta effect immediately since scripts are preloaded
    if (vantaRef.current && (window as any).VANTA) {
      vantaEffect.current = (window as any).VANTA.FOG({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        highlightColor: 0x142238,
        midtoneColor: 0x0a1525,
        lowlightColor: 0x04080c,
        baseColor: 0x020406,
        blurFactor: 0.45,
        speed: 0.7,
        zoom: 0.7,
      });
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
      }
    };
  }, []);

  const displayMessage = message || wittyMessages[currentMessage];

  return (
    <div
      ref={vantaRef}
      style={{
        ...styles.container,
        animation: fadingOut ? "fadeOut 0.5s ease-out forwards" : undefined,
      }}
    >
      {/* Artemis Logo */}
      <div style={styles.logoSection}>
        <img src={projectLogo} alt="Artemis" style={styles.logo} />
        <div style={styles.tagline}>Hunt Smarter, Not Harder</div>
      </div>

      {/* Loading Bar */}
      <div style={styles.progressBar}>
        <div style={styles.progressFill} />
      </div>

      <style>{`
        @keyframes slideRight {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgBase,
    fontFamily: "system-ui, sans-serif",
  },
  logoSection: {
    textAlign: "center",
    marginBottom: "48px",
    animation: "fadeIn 0.6s ease-out",
  },
  logo: {
    height: "120px",
    objectFit: "contain",
  },
  tagline: {
    fontSize: "14px",
    fontWeight: 500,
    color: colors.textMuted,
    marginTop: "12px",
    letterSpacing: "1px",
    fontStyle: "italic",
  },
  message: {
    fontSize: "14px",
    fontWeight: 500,
    color: colors.textSecondary,
    marginBottom: "24px",
    minHeight: "24px",
    textAlign: "center",
    animation: "fadeIn 0.3s ease-out",
  },
  progressBar: {
    position: "relative",
    width: "280px",
    height: "4px",
    backgroundColor: colors.border,
    borderRadius: "2px",
    overflow: "hidden",
  },
  progressFill: {
    position: "absolute",
    height: "100%",
    width: "25%",
    backgroundColor: "#ff8c42",
    borderRadius: "2px",
    animation: "slideRight 1.5s ease-in-out infinite",
  },
};
