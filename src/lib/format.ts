export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

export function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const TRAINING_TYPES = [
  "Chest Day",
  "Leg Day",
  "Back & Biceps",
  "Shoulders",
  "Arms",
  "Cardio",
  "Full Body",
  "Other",
] as const;

export const TRAINING_STYLES = [
  "Powerlifting",
  "Bodybuilding",
  "Cardio",
  "CrossFit",
  "General Fitness",
] as const;

export const GYM_CHALLENGE_TYPES = {
  highest_bench_press: { label: "Highest Bench Press", unit: "kg", timed: false },
  highest_squat: { label: "Highest Squat", unit: "kg", timed: false },
  highest_deadlift: { label: "Highest Deadlift", unit: "kg", timed: false },
  most_pullups: { label: "Most Pull-ups", unit: "reps", timed: false },
  most_pushups: { label: "Most Push-ups", unit: "reps", timed: false },
  fastest_5km: { label: "Fastest 5km", unit: "time", timed: true },
  longest_plank: { label: "Longest Plank", unit: "time", timed: true },
} as const;

export const INTER_COMP_TYPES = {
  total_bench_press: { label: "Total Bench Press", unit: "kg", agg: "sum" },
  total_deadlift: { label: "Total Deadlift", unit: "kg", agg: "sum" },
  total_checkins: { label: "Total Check-ins", unit: "checkins", agg: "auto" },
  most_pbs: { label: "Most PBs", unit: "PBs", agg: "count" },
  total_pullups: { label: "Total Pull-ups", unit: "reps", agg: "sum" },
  highest_avg_bench: { label: "Highest Avg Bench", unit: "kg", agg: "avg" },
} as const;
