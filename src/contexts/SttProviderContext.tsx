import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_STT_PROVIDER } from '../config/api';

type SttProvider = 'whisper' | 'huggingface' | 'elevenlabs';

interface SttProviderContextValue {
  provider: SttProvider;
  setProvider: (value: SttProvider) => void;
}

const STORAGE_KEY = 'sttProviderPreference';

const SttProviderContext = createContext<SttProviderContextValue>({
  provider: DEFAULT_STT_PROVIDER as SttProvider,
  setProvider: () => {}
});

const getInitialProvider = (): SttProvider => {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return stored as SttProvider;
    }
  }
  return DEFAULT_STT_PROVIDER as SttProvider;
};

export function SttProviderProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<SttProvider>(getInitialProvider);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, provider);
  }, [provider]);

  const value = useMemo(() => ({ provider, setProvider }), [provider]);

  return <SttProviderContext.Provider value={value}>{children}</SttProviderContext.Provider>;
}

export function useSttProvider() {
  return useContext(SttProviderContext);
}

