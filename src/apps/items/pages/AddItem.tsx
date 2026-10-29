import { useNavigate } from 'react-router-dom';
import { createItem } from '../../../api/items/api';
import ItemForm from '../components/ItemForm';

export default function AddItem() {
  const navigate = useNavigate();

  return (
    <ItemForm
      title="New item"
      submitLabel="Add item"
      onSubmit={async input => {
        const created = await createItem(input);
        navigate(`/${created.id}`, { replace: true });
      }}
    />
  );
}
