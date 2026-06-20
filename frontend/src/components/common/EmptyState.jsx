import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

export default function EmptyState({ title = 'No records found', message = '', icon: Icon = ShieldExclamationIcon, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      {message && <p className="text-gray-400 text-sm max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
