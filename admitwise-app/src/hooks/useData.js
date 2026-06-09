/**
 * useData.js
 * React hook that manages async data loading with loading/error states.
 */
import { useState, useEffect, useRef } from 'react';
import { loadFinalData, loadAllData, loadMeta } from '../utils/dataLoader';

export function useMeta() {
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMeta()
      .then(setMeta)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { meta, loading, error };
}

export function useFinalData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFinalData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useAllData(enabled = false) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const triggered = useRef(false);

  useEffect(() => {
    if (!enabled || triggered.current) return;
    triggered.current = true;
    setLoading(true);
    loadAllData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [enabled]);

  return { data, loading, error };
}
