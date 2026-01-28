import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ItemsAppLayout from './apps/items/components/ItemsAppLayout';

// Items App Pages
import ItemsDashboard from './apps/items/pages/Dashboard';

import ItemDetails from './apps/items/pages/ItemDetails';
import AddItem from './apps/items/pages/AddItem';
import EditItem from './apps/items/pages/EditItem';

function App() {
  return (
    <Router>
      <ItemsAppLayout>
        <Routes>
          <Route path="/" element={<ItemsDashboard />} />

          <Route path="/new" element={<AddItem />} />
          <Route path="/:id" element={<ItemDetails />} />
          <Route path="/:id/edit" element={<EditItem />} />
          {/* Redirect any unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ItemsAppLayout>
    </Router>
  );
}

export default App;
