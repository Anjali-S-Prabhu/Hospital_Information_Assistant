/**
 * StatsCard Component — Hospital Information Assistant
 *
 * Why it is written:
 * To provide a reusable, visually appealing metric card for the dashboard page.
 * Each card displays a key statistic (e.g., total patients, appointments today)
 * with an icon, value, and label.
 *
 * What it does:
 * - Renders a card with a colored icon container, a large numeric value, and a label.
 * - Supports customizable background color tints for the icon container.
 * - Includes a subtle hover lift animation for interactivity.
 * - Uses the animate-fade-in class for entry animation.
 *
 * Inputs:
 * - icon (ReactNode): A Lucide icon element to display.
 * - value (string | number): The metric value to display prominently.
 * - label (string): Descriptive label beneath the value.
 * - color (string): Tailwind background color class for the icon container (e.g., "bg-primary-100").
 * - iconColor (string): Tailwind text color class for the icon (e.g., "text-primary-600").
 *
 * Outputs:
 * - JSX.Element: The rendered stats card.
 */

import type { ReactNode } from "react";

interface StatsCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  color: string;
  iconColor: string;
}

export default function StatsCard({
  icon,
  value,
  label,
  color,
  iconColor,
}: StatsCardProps) {
  return (
    <div className="group rounded-2xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 animate-fade-in">
      {/* Icon container */}
      <div
        className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${color} mb-4`}
      >
        <span className={`${iconColor}`}>{icon}</span>
      </div>

      {/* Metric value */}
      <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>

      {/* Label */}
      <p className="text-sm text-slate-500 mt-1 font-medium">{label}</p>
    </div>
  );
}
