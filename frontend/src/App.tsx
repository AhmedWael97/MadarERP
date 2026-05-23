import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { Providers } from './app/providers';

export default function App() {
  return (
    <Providers>
      {/* v7_startTransition opts every navigation into React.startTransition,
          matching React Router v7's default and silencing the deprecation
          warning. (The other v7 flags live on the router itself — see
          app/router.tsx.) */}
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </Providers>
  );
}
