/**
 * Tests for shared UI components
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Target, DollarSign, Activity } from "lucide-react";

import { HeroCard } from "./HeroCard";
import { HeroGrid } from "./HeroGrid";
import { Panel } from "./Panel";
import { DetailRow } from "./DetailRow";
import { EmptyState } from "./EmptyState";
import { colors } from "./tokens";

describe("HeroCard", () => {
  it("renders label and value", () => {
    render(<HeroCard icon={Target} label="HIT RATE" value="85.5%" />);

    expect(screen.getByText("HIT RATE")).toBeInTheDocument();
    expect(screen.getByText("85.5%")).toBeInTheDocument();
  });

  it("renders unit when provided", () => {
    render(<HeroCard icon={Target} label="KILLS" value={42} unit="per hour" />);

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("per hour")).toBeInTheDocument();
  });

  it("applies custom color to value", () => {
    render(
      <HeroCard icon={Target} label="PROFIT" value="+10.00" color="#22c55e" />
    );

    const value = screen.getByText("+10.00");
    expect(value).toHaveStyle({ color: "#22c55e" });
  });

  it("renders without unit", () => {
    render(<HeroCard icon={Target} label="TEST" value="100" />);

    expect(screen.getByText("TEST")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });
});

describe("HeroGrid", () => {
  it("renders children", () => {
    render(
      <HeroGrid>
        <div data-testid="child-1">Card 1</div>
        <div data-testid="child-2">Card 2</div>
      </HeroGrid>
    );

    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
  });

  it("defaults to 4 columns", () => {
    const { container } = render(
      <HeroGrid>
        <div>Card</div>
      </HeroGrid>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(4, 1fr)" });
  });

  it("accepts custom column count", () => {
    const { container } = render(
      <HeroGrid columns={3}>
        <div>Card</div>
      </HeroGrid>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(3, 1fr)" });
  });
});

describe("Panel", () => {
  it("renders title", () => {
    render(
      <Panel title="Combat Details">
        <div>Content</div>
      </Panel>
    );

    expect(screen.getByText("Combat Details")).toBeInTheDocument();
  });

  it("renders children when expanded by default", () => {
    render(
      <Panel title="Test Panel">
        <div data-testid="content">Panel Content</div>
      </Panel>
    );

    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("hides children when defaultExpanded is false", () => {
    render(
      <Panel title="Test Panel" defaultExpanded={false}>
        <div data-testid="content">Panel Content</div>
      </Panel>
    );

    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("toggles content visibility on click", () => {
    render(
      <Panel title="Clickable Panel">
        <div data-testid="content">Hidden Content</div>
      </Panel>
    );

    // Content visible initially
    expect(screen.getByTestId("content")).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(screen.getByText("Clickable Panel"));
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText("Clickable Panel"));
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("does not toggle when collapsible is false", () => {
    render(
      <Panel title="Static Panel" collapsible={false}>
        <div data-testid="content">Always Visible</div>
      </Panel>
    );

    // Click should not collapse
    fireEvent.click(screen.getByText("Static Panel"));
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("renders headerRight content", () => {
    render(
      <Panel title="Panel" headerRight={<span data-testid="badge">3</span>}>
        <div>Content</div>
      </Panel>
    );

    expect(screen.getByTestId("badge")).toBeInTheDocument();
  });
});

describe("DetailRow", () => {
  it("renders label and value", () => {
    render(<DetailRow label="Total Shots" value={1234} />);

    expect(screen.getByText("Total Shots")).toBeInTheDocument();
    expect(screen.getByText("1234")).toBeInTheDocument();
  });

  it("renders string values", () => {
    render(<DetailRow label="Status" value="Active" />);

    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies custom color to value", () => {
    render(<DetailRow label="Deaths" value={5} color="#ef4444" />);

    const value = screen.getByText("5");
    expect(value).toHaveStyle({ color: "#ef4444" });
  });

  it("uses default color when none provided", () => {
    render(<DetailRow label="Test" value="Value" />);

    const value = screen.getByText("Value");
    expect(value).toHaveStyle({ color: colors.textPrimary });
  });
});

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState icon={Activity} title="No Data Yet" />);

    expect(screen.getByText("No Data Yet")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <EmptyState
        icon={Activity}
        title="No Data"
        subtitle="Start tracking to see analytics"
      />
    );

    expect(screen.getByText("No Data")).toBeInTheDocument();
    expect(
      screen.getByText("Start tracking to see analytics")
    ).toBeInTheDocument();
  });

  it("renders without subtitle", () => {
    render(<EmptyState icon={DollarSign} title="Empty" />);

    expect(screen.getByText("Empty")).toBeInTheDocument();
  });
});

describe("tokens", () => {
  it("exports color constants", () => {
    expect(colors.success).toBe("#22c55e");
    expect(colors.danger).toBe("#ef4444");
    expect(colors.warning).toBe("#f59e0b");
    expect(colors.info).toBe("#06b6d4");
  });

  it("exports background colors", () => {
    expect(colors.bgBase).toBeDefined();
    expect(colors.bgCard).toBeDefined();
    expect(colors.bgPanel).toBeDefined();
  });

  it("exports text colors", () => {
    expect(colors.textPrimary).toBe("#f8fafc");
    expect(colors.textSecondary).toBe("#94a3b8");
    expect(colors.textMuted).toBe("#64748b");
  });
});
