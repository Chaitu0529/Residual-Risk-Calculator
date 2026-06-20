import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import RiskForm from '../components/risks/RiskForm';
import { riskService } from '../services/riskService';

export default function CreateRisk() {
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    const res = await riskService.create(data);
    toast.success('Risk record created successfully');
    navigate(`/risks/${res.data.id}`);
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/risks')}
          className="btn-ghost p-2"
          aria-label="Back"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title">Create Risk Record</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Define a new risk with scoring and controls
          </p>
        </div>
      </div>
      <RiskForm onSubmit={handleSubmit} />
    </div>
  );
}
