import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-paper border border-sketch border-dashed rounded-2xl p-8 sm:p-12 text-center">
      <div className="text-sketch flex justify-center mb-4">{icon}</div>
      <p className="text-ink-lighter text-lg font-medium mb-1">{title}</p>
      {description && <p className="text-ink-muted text-sm mb-4">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
