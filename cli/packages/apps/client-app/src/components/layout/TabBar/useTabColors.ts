/**
 * Module color mapping - Microsoft 365 style
 */
export function getModuleColor(path: string): { color: string; className: string } {
  if (path.includes("/patients") || path === "/")
    return { color: "#0066CC", className: "text-primary" }; // Patient Overview
  if (path.includes("/clinical")) return { color: "#2A7FA9", className: "text-[#2A7FA9]" }; // Clinical Charts
  if (path.includes("/results") || path.includes("/labs"))
    return { color: "#9C27B0", className: "text-info" }; // Labs & Results
  if (path.includes("/pharmacy") || path.includes("/care"))
    return { color: "#1E8D4C", className: "text-accent" }; // Care Plans
  if (path.includes("/scheduling") || path.includes("/messaging"))
    return { color: "#FFC900", className: "text-[#FFC900]" }; // Messaging
  if (path.includes("/orders") || path.includes("/alerts"))
    return { color: "#D6461F", className: "text-warning" }; // Alerts/Flags (WCAG AA)
  return { color: "#0066CC", className: "text-primary" }; // Default
}
