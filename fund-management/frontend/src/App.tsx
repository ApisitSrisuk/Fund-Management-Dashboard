import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { isApiError } from './api/client';
import { Layout } from './components/Layout';
import { CustomerProvider } from './context/CustomerContext';
import { NotFoundPage } from './pages/NotFoundPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { PolicyDetailPage } from './pages/PolicyDetailPage';
import { PortfoliosPage } from './pages/portfolios/PortfoliosPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: (failureCount, error) =>
        failureCount < 2 && (!isApiError(error) || error.kind === 'network' || error.kind === 'server'),
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CustomerProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/policies" replace />} />
              <Route path="policies" element={<PoliciesPage />} />
              <Route path="policies/:id" element={<PolicyDetailPage />} />
              <Route path="portfolios" element={<PortfoliosPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CustomerProvider>
    </QueryClientProvider>
  );
}
