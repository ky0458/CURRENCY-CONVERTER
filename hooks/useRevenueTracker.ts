import { useState, useEffect } from 'react';
import { RevenueRecord } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useRevenueTracker = () => {
  const [records, setRecords] = useState<RevenueRecord[]>([]);
  const { user } = useAuth();

  // Load Data & Sync Logic
  useEffect(() => {
    const loadData = () => {
      try {
        const savedRecords = localStorage.getItem('app_revenue_records');
        if (savedRecords) {
          const parsed = JSON.parse(savedRecords);
          setRecords(parsed);
        }
      } catch (e) {
        console.error("Failed to load revenue records", e);
      }
    };
    loadData();
  }, [user]);

  // Unified Persist Function
  const persistData = (newRecords: RevenueRecord[]) => {
    // 1. Update State
    setRecords(newRecords);

    // 2. Always save to LocalStorage (as cache/backup)
    localStorage.setItem('app_revenue_records', JSON.stringify(newRecords));
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