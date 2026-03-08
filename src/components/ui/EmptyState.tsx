import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-8 sm:p-12 text-center">
      <div className="text-gray-300 flex justify-center mb-4">{icon}</div>
      <p className="text-gray-500 text-lg font-medium mb-1">{title}</p>
      {description && <p className="text-gray-400 text-sm mb-4">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
