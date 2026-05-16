import { useState, useEffect, useCallback } from 'react';
import { RevenueRecord } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useRevenueTracker = () => {
  const [records, setRecords] = useState<RevenueRecord[]>([]);
  const { user } = useAuth();

  // Load Data & Sync Logic
  const loadData = useCallback(async (isRefocus = false) => {
      let localRecords: RevenueRecord[] = [];
      const savedRecordsOwner = localStorage.getItem('app_revenue_records_owner');
      const currentOwner = user?.uid || 'guest';
      const shouldLoadLocalRecords = !savedRecordsOwner || savedRecordsOwner === currentOwner || savedRecordsOwner === 'guest';

      try {
        const savedRecords = localStorage.getItem('app_revenue_records');
        if (shouldLoadLocalRecords && savedRecords) {
          localRecords = JSON.parse(savedRecords);
        }
      } catch (e) {
        console.error("Failed to load revenue records", e);
      }

      if (user && user.uid) {
        try {
          const response = await fetch(`/api/statistics-history?uid=${user.uid}`, { headers: { 'x-user-uid': user.uid }});
          if (response.ok) {
            const data = await response.json();
            if (data && data.revenues) {
              const dbRevenues = data.revenues;
              
              const mergedMap = new Map();
              if (!isRefocus) {
                  localRecords.forEach((i: RevenueRecord) => mergedMap.set(i.id, i));
              }
              dbRevenues.forEach((i: RevenueRecord) => mergedMap.set(i.id, i));
              
              const finalRecords = Array.from(mergedMap.values()).sort((a: any, b: any) => b.timestamp - a.timestamp);
              
              setRecords(finalRecords);
              localStorage.setItem('app_revenue_records', JSON.stringify(finalRecords));
              localStorage.setItem('app_revenue_records_owner', user.uid);
              
              if (!isRefocus) {
                  fetch('/api/statistics-history/revenues', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-user-uid': user.uid },
                    body: JSON.stringify({ uid: user.uid, revenues: finalRecords })
                  }).catch(console.error);
              }
              return;
            }
          }
        } catch (err) {
          console.error("Failed to fetch revenue records from DB", err);
        }
      }
      setRecords(localRecords);
    }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        loadData(true);
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadData, user]);

  // Unified Persist Function
  const persistData = async (newRecords: RevenueRecord[]) => {
    // 1. Update State
    setRecords(newRecords);

    // 2. Always save to LocalStorage (as cache/backup)
    localStorage.setItem('app_revenue_records', JSON.stringify(newRecords));
    if (user && user.uid) {
      localStorage.setItem('app_revenue_records_owner', user.uid);
    } else {
      localStorage.setItem('app_revenue_records_owner', 'guest');
    }
    
    // 3. Save to DB
    if (user && user.uid) {
      try {
        await fetch('/api/statistics-history/revenues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-uid': user.uid },
          body: JSON.stringify({ uid: user.uid, revenues: newRecords })
        });
      } catch (err) {
        console.error("Failed to sync revenues to DB", err);
      }
    }
  };

  const addRecord = (
    inputSalary: number, 
    shareType: 'all' | 'cv' | 'job', 
    totalRevenue: number, 
    netIncome: number
  ) => {
    const newRecord: RevenueRecord = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
      inputSalary,
      shareType,
      totalRevenue,
      netIncome
    };
    const updated = [newRecord, ...records];
    persistData(updated);
  };

  const updateRecord = (id: string, updates: Partial<RevenueRecord>) => {
    const updated = records.map(r => r.id === id ? { ...r, ...updates } : r);
    persistData(updated);
  };

  const deleteRecord = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    persistData(updated);
  };

  const deleteRecords = (ids: string[]) => {
    const updated = records.filter(r => !ids.includes(r.id));
    persistData(updated);
  };

  return {
    records,
    addRecord,
    updateRecord,
    deleteRecord,
    deleteRecords
  };
};