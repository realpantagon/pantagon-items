import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchItemById, getCachedItem, updateItem } from '../../../api/items/api';
import type { PantagonItem } from '../../../api/items/types';
import { useGoBack } from '../../../shared/hooks/useGoBack';
import Button from '../../../shared/components/Button';
import ItemForm from '../components/ItemForm';

export default function EditItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack(id ? `/${id}` : '/');
  const [item, setItem] = useState<PantagonItem | null>(() => (id ? getCachedItem(id) : null));
  const [loading, setLoading] = useState(() => !(id && getCachedItem(id)));

  useEffect(() => {
    // Skip the refetch when the cache already has it, so typed input isn't reset
    if (!id || item) return;
    fetchItemById(id)
      .then(setItem)
      .catch(error => console.error('Error fetching item:', error))
      .finally(() => setLoading(false));
  }, [id, item]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px' }}>
        <div className="skeleton" style={{ height: '36px', width: '50%' }} />
        <div className="skeleton" style={{ height: '220px' }} />
        <div className="skeleton" style={{ height: '160px' }} />
      </div>
    );
  }

  if (!item || !id) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)' }}>Item not found</div>
        <Button variant="secondary" onClick={() => navigate('/')}>Back to items</Button>
      </div>
    );
  }

  return (
    <ItemForm
      title="Edit item"
      submitLabel="Save changes"
      initial={item}
      onSubmit={async input => {
        await updateItem(id, input);
        goBack();
      }}
    />
  );
}
