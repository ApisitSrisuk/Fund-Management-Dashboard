import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import type { Customer } from '../types';

const STORAGE_KEY = 'fund-dashboard:customerId';

interface CustomerContextValue {
  customers: Customer[];
  customer: Customer | undefined;
  setCustomerId: (id: string) => void;
  isLoading: boolean;
  error: Error | null;
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

function readStoredId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * There is no auth in scope, so the "current customer" is picked from a dropdown.
 * In a real app this would come from the session/JWT instead.
 */
export function CustomerProvider({ children }: { children: ReactNode }) {
  const { data: customers = [], isLoading, error } = useCustomers();
  const [selectedId, setSelectedId] = useState<string | null>(readStoredId);

  const customer = customers.find((c) => c.id === selectedId) ?? customers[0];

  useEffect(() => {
    if (!customer) return;
    try {
      localStorage.setItem(STORAGE_KEY, customer.id);
    } catch {
      // storage unavailable (private mode) — selection just won't persist
    }
  }, [customer]);

  const value = useMemo<CustomerContextValue>(
    () => ({ customers, customer, setCustomerId: setSelectedId, isLoading, error }),
    [customers, customer, isLoading, error],
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCurrentCustomer(): CustomerContextValue {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCurrentCustomer must be used inside <CustomerProvider>');
  return ctx;
}
