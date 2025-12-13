import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TranslationProvider } from '@/lib/i18n/TranslationProvider';
import Router from './router';
import './index.css';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TranslationProvider defaultLocale="en">
      <QueryClientProvider client={queryClient}>
        <Router />
      </QueryClientProvider>
    </TranslationProvider>
  </StrictMode>
);

