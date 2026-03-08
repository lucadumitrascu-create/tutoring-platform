export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bună dimineața';
  if (hour < 18) return 'Bună ziua';
  return 'Bună seara';
}

export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMs < 0) {
    const absMins = Math.abs(diffMins);
    const absHours = Math.abs(diffHours);
    const absDays = Math.abs(diffDays);
    if (absMins < 60) return `acum ${absMins} min`;
    if (absHours < 24) return `acum ${absHours}h`;
    return `acum ${absDays} zile`;
  }

  if (diffMins < 60) return `în ${diffMins} min`;
  if (diffHours < 24) return `în ${diffHours}h`;
  if (diffDays === 1) return 'mâine';
  return `în ${diffDays} zile`;
}

const GROUP_COLORS = [
  { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700' },
  { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700' },
  { bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-700' },
  { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700' },
  { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-700' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-700' },
  { bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-700' },
  { bg: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-700' },
];

export function getGroupColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length];
}

export const assignmentStatusConfig = {
  pending: { label: 'De trimis', bg: 'bg-amber-100', text: 'text-amber-700' },
  submitted: { label: 'Trimis', bg: 'bg-blue-100', text: 'text-blue-700' },
  approved: { label: 'Aprobat', bg: 'bg-green-100', text: 'text-green-700' },
  rejected: { label: 'Respins', bg: 'bg-red-100', text: 'text-red-700' },
} as const;
