import { RouterProvider } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { router } from '@/routes';
import './index.css';

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Analytics />
    </>
  );
}

export default App;
