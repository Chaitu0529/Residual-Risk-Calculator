import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import RiskForm from '../components/risks/RiskForm';
import { riskService } from '../services/riskService';
import { FullPageSpinner } from '../components/common/Spinner';

export default function EditRisk() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    riskService.getById(id)
      .then((res) => setRisk(res.data))
      .catch(() => {
        toast.error('Risk record not found');
        navigate('/risks');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSubmit = async (data) => {
    await riskService.update(id, data);
    toast.success('Risk record updated successfully');
    navigate(`/risks/${id}`);
  };

  if (loading) return <FullPageSpinner />;

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/risks/${id}`)}
          className="btn-ghost p-2"
          aria-label="Back"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title">Edit Risk Record</h1>
          <p className="text-gray-400 text-sm mt-0.5 truncate max-w-xl">{risk?.riskTitle}</p>
        </div>
      </div>
      <RiskForm initialData={risk} onSubmit={handleSubmit} isEdit />
    </div>
  );
}
