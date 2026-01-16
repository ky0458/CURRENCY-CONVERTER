
import { useState, useEffect } from 'react';
import { RevenueRecord } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

export const useRevenueTracker = () => {
  const [records, setRecords] = useState<RevenueRecord[]>([]);
  const { user } = useAuth();

  // Load Data & Sync Logic
  useEffect(() => {
    let unsubscribe = () => {};

    if (user) {
        // LOGGED IN USER: Sync with Firestore Real-time
        const docRef = doc(db, "users", user.uid);
        
        unsubscribe = onSnapshot(docRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.revenueRecords) {
                    setRecords(data.revenueRecords);
                }
            } else {
                // If user document doesn't exist, we might want to migrate local data once
                try {
                    const localData = localStorage.getItem('app_revenue_records');
                    if (localData) {
                        const parsedRecords = JSON.parse(localData);
                        if (Array.isArray(parsedRecords) && parsedRecords.length > 0) {
                            // Initial Migration: Create doc with local data
                            await setDoc(docRef, { revenueRecords: parsedRecords }, { merge: true });
                            // The snapshot will fire again after this write, updating state
                        }
                    }
                } catch (err) {
                    console.error("Error migrating local revenue data to cloud", err);
                }
            }
        }, (error) => {
            console.error("Firestore revenue sync error:", error);
        });

    } else {
        // GUEST USER: Load from LocalStorage
        try {
          const savedRecords = localStorage.getItem('app_revenue_records');
          if (savedRecords) setRecords(JSON.parse(savedRecords));
          else setRecords([]);
        } catch (e) {
          console.error("Failed to load revenue records from LocalStorage", e);
        }
    }

    return () => unsubscribe();
  }, [user]);

  // Unified Persist Function
  const persistData = async (newRecords: RevenueRecord[]) => {
    // 1. Update State (Optimistic)
    setRecords(newRecords);

    // 2. Always save to LocalStorage (as cache/backup)
    localStorage.setItem('app_revenue_records', JSON.stringify(newRecords));

    // 3. If Logged In, save to Firestore
    if (user) {
      try {
        const docRef = doc(db, "users", user.uid);
        await setDoc(docRef, { revenueRecords: newRecords }, { merge: true });
      } catch (e) {
        console.error("Failed to save revenue records to Firestore", e);
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
