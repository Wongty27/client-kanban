import { LabelColor } from "@/types";

export function getLabelColorClass(color: LabelColor): string {
  const colorMap: Record<LabelColor, string> = {
    red: "bg-label-red",
    orange: "bg-label-orange",
    yellow: "bg-label-yellow",
    green: "bg-label-green",
    teal: "bg-label-teal",
    blue: "bg-label-blue",
    purple: "bg-label-purple",
    pink: "bg-label-pink",
    gray: "bg-label-gray",
  };
  return colorMap[color];
}
