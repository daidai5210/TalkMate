import { useNavigate } from 'react-router-dom';
import type { Scenario } from './types';

interface Props {
  scenario: Scenario;
}

export default function ScenarioCard({ scenario }: Props) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/conversation/${scenario.id}`)}
      data-testid={`scenario-card-${scenario.id}`}
      className="group bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-100 hover:border-brand-500 transition p-5 text-left flex flex-col gap-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      <div className="text-4xl" aria-hidden="true">
        {scenario.icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-brand-600">
          {scenario.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{scenario.description}</p>
      </div>
      <div className="mt-auto pt-2">
        <span className="inline-flex items-center text-sm font-medium text-brand-600 group-hover:underline">
          开始练习
          <span aria-hidden="true" className="ml-1">
            →
          </span>
        </span>
      </div>
    </button>
  );
}
