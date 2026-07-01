import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as xlsx from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';


type TabType = 'transactions' | 'payroll' | 'jobs';

export const AccountingDashboard: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    const { user, showNotification } = useAuth();
    const { cnyRate } = useCurrencyConverter();
    const [activeTab, setActiveTab] = useState<TabType>('transactions');
    const [rowData, setRowData] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [showPayrollForm, setShowPayrollForm] = useState(false);
    const [payrollForm, setPayrollForm] = useState({
        employeeName: '',
        position: '',
        department: '',
        month: new Date().toISOString().slice(0, 7),
        bankName: '',
        bankAccount: ''
    });
    const [selectedPayrollIndex, setSelectedPayrollIndex] = useState<number | null>(null);
    const [showTransactionForm, setShowTransactionForm] = useState(false);
    const [transactionForm, setTransactionForm] = useState({ date: new Date().toISOString().slice(0, 10), type: 'Income', subType: '', amountVnd: '', amountRmb: '', exchangeRate: '', description: '' });
    const [showJobForm, setShowJobForm] = useState(false);
    const [jobForm, setJobForm] = useState({ jobCode: '', jobName: '', clientName: '', status: 'Open' });
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [showRevenuesModal, setShowRevenuesModal] = useState(false);
    const [editingRevenueIndex, setEditingRevenueIndex] = useState<number | null>(null);
    const [editingPenaltyIndex, setEditingPenaltyIndex] = useState<number | null>(null);
    const [revenueForm, setRevenueForm] = useState({
        contractCode: '',
        jobName: '',
        revenuePosition: '',
        currency: 'VND', // 'VND' | 'RMB'
        amount: '',
        collectionDate: new Date().toISOString().slice(0, 10),
        collectionPhase: 'Phase 1' // 'Phase 1' | 'Phase 2'
    });
    
    // Penalty Modal State
    const [showPenaltyModal, setShowPenaltyModal] = useState(false);
    const [penaltyForm, setPenaltyForm] = useState({
        amount: '',
        note: ''
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filterDate, setFilterDate] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        onConfirm: () => void;
    } | null>(null);

    const executeConfirm = (title: string, message: React.ReactNode, onConfirm: () => void) => {
        setConfirmModal({ isOpen: true, title, message, onConfirm });
    };

    // Initial load
    useEffect(() => {
        if (!user) return;
        fetchJobs();
        loadData();
    }, [activeTab, user]);

    const fetchJobs = async () => {
        try {
            const res = await fetch(`/api/accounting/jobs?uid=${user?.uid}`, {
                headers: { 'x-user-uid': user?.uid || '' }
            });
            const data = await res.json();
            setJobs(data);
        } catch (e) {
            console.error('Fetch jobs error', e);
        }
    };

    const loadData = async () => {
        try {
            setSelectedIds(new Set());
            let endpoint = '';
            if (activeTab === 'transactions') endpoint = `/api/accounting/transactions?uid=${user?.uid}`;
            if (activeTab === 'payroll') endpoint = `/api/accounting/payroll?uid=${user?.uid}`;
            if (activeTab === 'jobs') endpoint = `/api/accounting/jobs?uid=${user?.uid}`;
            
            const res = await fetch(endpoint, {
                headers: { 'x-user-uid': user?.uid || '' }
            });
            const data = await res.json();
            setRowData(data);
        } catch (e) {
            console.error('Initial load error', e);
        }
    };

    const toggleSelection = (index: number) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedIds(newSet);
    };

    const toggleSelectAll = (filteredIndices: number[]) => {
        if (selectedIds.size === filteredIndices.length && filteredIndices.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredIndices));
        }
    };

    const handleDeleteRow = (index: number) => {
        const row = rowData[index];
        let content = '';
        if (activeTab === 'transactions') content = `Giao dịch: ${row.subType || 'Không rõ'} - ${new Intl.NumberFormat('vi-VN').format(row.amountVnd || 0)} VND`;
        if (activeTab === 'payroll') content = `Nhân viên: ${row.employeeName} - Tháng: ${row.month}`;
        if (activeTab === 'jobs') content = `Dự án: ${row.jobName} - Mã: ${row.jobCode}`;

        executeConfirm(
            'Xác nhận xóa bản ghi',
            <div className="text-sm text-slate-600">
                <p className="mb-3 text-base">Bạn có chắc chắn muốn xóa bản ghi này?</p>
                <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-red-800 font-medium">
                    {content}
                </div>
            </div>,
            () => {
                const newData = [...rowData];
                newData.splice(index, 1);
                setRowData(newData);
                handleSaveAll(newData, activeTab, true);
                setSelectedIds(new Set());
                setConfirmModal(null);
                showNotification('Đã xóa dữ liệu thành công', 'info');
            }
        );
    };

    const handleBatchDelete = () => {
        executeConfirm(
            'Xác nhận xóa hàng loạt',
            <div className="text-sm text-slate-600">
                <p className="mb-3 text-base">Bạn có chắc chắn muốn xóa {selectedIds.size} bản ghi đã chọn?</p>
            </div>,
            () => {
                const newData = rowData.filter((_, idx) => !selectedIds.has(idx));
                setRowData(newData);
                handleSaveAll(newData, activeTab, true);
                setSelectedIds(new Set());
                setConfirmModal(null);
                showNotification('Đã xóa dữ liệu thành công', 'info');
            }
        );
    };

    const handleSaveAll = async (dataToSave?: any[], tabToSave?: TabType, silent: boolean = false) => {
        try {
            const data = dataToSave || rowData;
            const tab = tabToSave || activeTab;
            
            const endpoint = `/api/accounting/${tab}`;
            const reqBody = {
                uid: user?.uid,
                batch: true,
                [tab]: data // body format aligns with backend
            };

            await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-uid': user?.uid || '' },
                body: JSON.stringify(reqBody)
            });
            if (!silent) {
                showNotification('Đã lưu dữ liệu thành công', 'success');
            }
        } catch (e) {
            console.error('Error saving data', e);
            if (!silent) {
                showNotification('Lỗi khi lưu dữ liệu', 'error');
            }
        }
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = xlsx.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = xlsx.utils.sheet_to_json(ws);
            setRowData(data); // Preview data in Grid
            handleSaveAll(data, activeTab, true);
            showNotification('Tải file và đồng bộ thành công.', 'success');
        };
        reader.readAsBinaryString(file);
    };

    const handleExportExcel = () => {
        const currentData: any[] = rowData;
        const ws = xlsx.utils.json_to_sheet(currentData);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Data");
        xlsx.writeFile(wb, `${activeTab}_export.xlsx`);
    };

    const handleAddNew = () => {
        setEditingIndex(null);
        if (activeTab === 'payroll') {
            setPayrollForm({
                employeeName: '',
                position: '',
                department: '',
                month: new Date().toISOString().slice(0, 7),
                bankName: '',
                bankAccount: ''
            });
            setShowPayrollForm(true);
        } else if (activeTab === 'transactions') {
            setTransactionForm({ date: new Date().toISOString().slice(0, 10), type: 'Income', subType: '', amountVnd: '', amountRmb: '', exchangeRate: '', description: '' });
            setShowTransactionForm(true);
        } else if (activeTab === 'jobs') {
            setJobForm({ jobCode: '', jobName: '', clientName: '', status: 'Open' });
            setShowJobForm(true);
        }
    };

    const handleEditRow = (data: any, index: number) => {
        setEditingIndex(index);
        if (activeTab === 'payroll') {
            setPayrollForm({
                employeeName: data.employeeName || '',
                position: data.position || '',
                department: data.department || '',
                month: data.month || new Date().toISOString().slice(0, 7),
                bankName: data.bankName || '',
                bankAccount: data.bankAccount || ''
            });
            setShowPayrollForm(true);
        } else if (activeTab === 'transactions') {
            setTransactionForm({ ...data });
            setShowTransactionForm(true);
        } else if (activeTab === 'jobs') {
            setJobForm({ ...data });
            setShowJobForm(true);
        }
    };

    const handlePayrollSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const actionName = editingIndex !== null ? 'Cập nhật' : 'Thêm mới';
        executeConfirm(
            `Xác nhận ${actionName.toLowerCase()} lương`,
            <div className="text-sm text-slate-600">
                <p className="mb-3 text-base">Bạn có chắc chắn muốn lưu thông tin này không?</p>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-medium">
                    <p><strong>Nhân viên:</strong> {payrollForm.employeeName}</p>
                    <p><strong>Tháng:</strong> {payrollForm.month}</p>
                </div>
            </div>,
            () => {
                const newRowData = [...rowData];
                if (editingIndex !== null) {
                    newRowData[editingIndex] = { ...newRowData[editingIndex], ...payrollForm };
                    showNotification('Đã cập nhật dữ liệu lương', 'success');
                } else {
                    newRowData.push({ ...payrollForm, id: Date.now(), revenues: [], penalties: [] });
                    showNotification('Đã thêm nhân viên, tiếp theo hãy thêm các khoản doanh thu cho nhân viên này', 'success');
                }
                setRowData(newRowData);
                handleSaveAll(newRowData, activeTab, true);
                setShowPayrollForm(false);
                setConfirmModal(null);
            }
        );
    };

    const handleTransactionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const actionName = editingIndex !== null ? 'Cập nhật' : 'Thêm mới';
        executeConfirm(
            `Xác nhận ${actionName.toLowerCase()} giao dịch`,
            <div className="text-sm text-slate-600">
                <p className="mb-3 text-base">Bạn có chắc chắn muốn lưu thông tin này không?</p>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-medium">
                    <p><strong>Ngày:</strong> {transactionForm.date}</p>
                    <p><strong>Loại:</strong> {transactionForm.type === 'Income' ? 'Thu' : 'Chi'} - {transactionForm.subType}</p>
                    <p><strong>Số tiền:</strong> {new Intl.NumberFormat('vi-VN').format(Number(transactionForm.amountVnd) || 0)} VND</p>
                </div>
            </div>,
            () => {
                const newRowData = [...rowData];
                if (editingIndex !== null) {
                    newRowData[editingIndex] = { ...newRowData[editingIndex], ...transactionForm };
                    showNotification('Đã cập nhật giao dịch', 'success');
                } else {
                    newRowData.push({ ...transactionForm, id: Date.now() });
                    showNotification('Đã thêm giao dịch', 'success');
                }
                setRowData(newRowData);
                handleSaveAll(newRowData, activeTab, true);
                setShowTransactionForm(false);
                setConfirmModal(null);
            }
        );
    };

    const handleJobSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const actionName = editingIndex !== null ? 'Cập nhật' : 'Thêm mới';
        executeConfirm(
            `Xác nhận ${actionName.toLowerCase()} dự án`,
            <div className="text-sm text-slate-600">
                <p className="mb-3 text-base">Bạn có chắc chắn muốn lưu thông tin này không?</p>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-medium">
                    <p><strong>Mã dự án:</strong> {jobForm.jobCode}</p>
                    <p><strong>Tên dự án:</strong> {jobForm.jobName}</p>
                    <p><strong>Khách hàng:</strong> {jobForm.clientName}</p>
                </div>
            </div>,
            () => {
                const newRowData = [...rowData];
                if (editingIndex !== null) {
                    newRowData[editingIndex] = { ...newRowData[editingIndex], ...jobForm };
                    showNotification('Đã cập nhật dự án', 'success');
                } else {
                    newRowData.push({ ...jobForm, id: Date.now() });
                    showNotification('Đã thêm dự án', 'success');
                }
                setRowData(newRowData);
                handleSaveAll(newRowData, activeTab, true);
                setShowJobForm(false);
                setConfirmModal(null);
            }
        );
    };

    const handleAddRevenue = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedPayrollIndex === null) return;
        
        const actionName = editingRevenueIndex !== null ? 'Cập nhật' : 'Thêm mới';
        executeConfirm(
            `Xác nhận ${actionName.toLowerCase()} doanh thu`,
            <div className="text-sm text-slate-600">
                <p className="mb-3 text-base">Bạn có chắc chắn muốn lưu thông tin này không?</p>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-medium">
                    <p><strong>Dự án:</strong> {revenueForm.jobName} ({revenueForm.contractCode})</p>
                    <p><strong>Vị trí:</strong> {revenueForm.revenuePosition}</p>
                    <p><strong>Số tiền:</strong> {new Intl.NumberFormat('vi-VN').format(Number(revenueForm.amount.replace(/\D/g, '')) || 0)} {revenueForm.currency}</p>
                </div>
            </div>,
            () => {
                const newData = [...rowData];
                const targetRow = newData[selectedPayrollIndex];
                if (!targetRow.revenues) targetRow.revenues = [];
                
                const revenueData = {
                    contractCode: revenueForm.contractCode,
                    jobName: revenueForm.jobName,
                    revenuePosition: revenueForm.revenuePosition,
                    currency: revenueForm.currency,
                    amount: parseFloat(revenueForm.amount.replace(/\D/g, '')) || 0,
                    collectionDate: revenueForm.collectionDate,
                    collectionPhase: revenueForm.collectionPhase,
                    timestamp: new Date().toISOString()
                };

                if (editingRevenueIndex !== null) {
                    targetRow.revenues[editingRevenueIndex] = revenueData;
                } else {
                    targetRow.revenues.push(revenueData);
                }
                
                setRowData(newData);
                handleSaveAll(newData, activeTab, true);
                setRevenueForm({ 
                    contractCode: '', 
                    jobName: '', 
                    revenuePosition: '', 
                    currency: 'VND', 
                    amount: '', 
                    collectionDate: new Date().toISOString().slice(0, 10), 
                    collectionPhase: 'Phase 1' 
                });
                setEditingRevenueIndex(null);
                setConfirmModal(null);
                showNotification(`Đã ${actionName.toLowerCase()} doanh thu`, 'success');
            }
        );
    };

    const openPenaltyModal = (data: any, index: number) => {
        setSelectedPayrollIndex(index);
        setEditingPenaltyIndex(null);
        setPenaltyForm({
            amount: '',
            note: ''
        });
        setShowPenaltyModal(true);
    };

    const handleAddPenalty = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedPayrollIndex === null) return;
        
        const actionName = editingPenaltyIndex !== null ? 'Cập nhật' : 'Thêm mới';
        executeConfirm(
            `${actionName} khoản phạt`,
            <div className="text-sm text-slate-600">
                <p className="mb-3 text-base">Bạn có chắc chắn muốn {actionName.toLowerCase()} khoản phạt này?</p>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 space-y-1">
                    <p><strong>Số tiền:</strong> {penaltyForm.amount} VND</p>
                    {penaltyForm.note && <p><strong>Ghi chú:</strong> {penaltyForm.note}</p>}
                </div>
            </div>,
            () => {
                const newData = [...rowData];
                const targetRow = newData[selectedPayrollIndex];
                
                if (!targetRow.penalties) {
                    targetRow.penalties = [];
                }
                
                const penaltyData = {
                    amount: parseFloat(penaltyForm.amount.replace(/\D/g, '')) || 0,
                    note: penaltyForm.note,
                    id: editingPenaltyIndex !== null ? targetRow.penalties[editingPenaltyIndex].id : Date.now()
                };
                
                if (editingPenaltyIndex !== null) {
                    targetRow.penalties[editingPenaltyIndex] = penaltyData;
                } else {
                    targetRow.penalties.push(penaltyData);
                }
                
                setRowData(newData);
                handleSaveAll(newData, activeTab, true);
                setPenaltyForm({ amount: '', note: '' });
                setEditingPenaltyIndex(null);
                setConfirmModal(null);
                showNotification(`Đã ${actionName.toLowerCase()} khoản phạt`, 'success');
            }
        );
    };

    const openRevenueDetailsModal = (data: any, index: number) => {
        setSelectedPayrollIndex(index);
        setEditingRevenueIndex(null);
        setRevenueForm({
            contractCode: '',
            jobName: '',
            revenuePosition: '',
            currency: 'VND',
            amount: '',
            collectionDate: new Date().toISOString().slice(0, 10),
            collectionPhase: 'Phase 1'
        });
        setShowRevenuesModal(true);
    };

    return (
        <div className="absolute inset-0 bg-slate-50 z-[200] flex flex-col md:flex-row overflow-hidden pb-[env(safe-area-inset-bottom)] animate-slide-in-up">
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 py-6 px-4 flex flex-col gap-2 shrink-0 z-20">
                <div className="flex items-center justify-between mb-4 mt-2 px-2">
                   <h2 className="text-xl font-bold text-slate-800">Kế Toán</h2>
                   <button onClick={onExit} className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-sm font-semibold text-slate-600 flex items-center gap-1">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
                     Thoát
                   </button>
                </div>
                
                <button 
                    onClick={() => setActiveTab('transactions')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'transactions' ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    Thu / Chi
                </button>
                <button 
                    onClick={() => setActiveTab('payroll')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'payroll' ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                    Tính Lương
                </button>
                <button 
                    onClick={() => setActiveTab('jobs')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'jobs' ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" /></svg>
                    Quản Lý Projects
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
               <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 shrink-0 bg-white">
                  <h3 className="font-bold text-slate-800 text-lg">
                      {activeTab === 'transactions' ? "Bộ sổ Thu Chi" : activeTab === 'payroll' ? "Bảng Lương Nội Bộ" : "Theo Dõi Dự Án"}
                  </h3>
                  <div className="flex gap-2">
                     <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer flex items-center gap-2">
                        <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                        Import Excel
                     </label>
                     <button onClick={handleExportExcel} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                        Export Excel
                     </button>
                     <button onClick={handleAddNew} className="bg-primary-50 hover:bg-primary-100 text-primary-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors">
                        + {activeTab === 'payroll' ? 'Thêm nhân viên' : 'Thêm mới'}
                     </button>
                     {selectedIds.size > 0 && (
                         <button onClick={handleBatchDelete} className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors border border-rose-200">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                             Xóa ({selectedIds.size})
                         </button>
                     )}
                     <button onClick={handleSaveAll} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 shadow-sm md:ml-4 transition-colors">
                        Lưu Thay Đổi
                     </button>
                  </div>
               </div>

               {/* Custom List UI with Filters */}
               <div className="flex flex-col flex-1 relative overflow-hidden bg-slate-50/50">
                  {/* Filter Bar */}
                  <div className="flex flex-col shrink-0 bg-white border-b border-slate-100 shadow-sm p-4 gap-3 z-10">
                     <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400">
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                              </svg>
                           </div>
                           <input type="search" placeholder="Tìm kiếm dữ liệu..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800" />
                        </div>
                        <button onClick={() => setShowFilters(!showFilters)} className={`p-2 border rounded-xl transition-all ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600'}`}>
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" /></svg>
                        </button>
                     </div>
                     
                     {showFilters && (
                        <div className="flex flex-wrap items-center gap-3 animate-fade-in mt-2 border-t border-slate-100 pt-3">
                            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" title="Lọc theo ngày/tháng" />
                            {activeTab === 'transactions' && (
                                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                                    <option value="">Tất cả loại giao dịch</option>
                                    <option value="Income">Thu (Income)</option>
                                    <option value="Expense">Chi (Expense)</option>
                                </select>
                            )}
                            {activeTab === 'jobs' && (
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="Open">Open</option>
                                    <option value="Closed">Closed</option>
                                    <option value="Pending">Pending</option>
                                </select>
                            )}
                            {(filterDate || filterType || filterStatus) && (
                                <button onClick={() => { setFilterDate(''); setFilterType(''); setFilterStatus(''); }} className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors ml-auto">Xóa lọc</button>
                            )}
                        </div>
                     )}
                  </div>

                  {/* List Content */}
                  <div className="flex-1 overflow-auto border-t border-slate-200 bg-white">
                        {rowData.length === 0 ? (
                            <div className="text-center text-slate-400 py-16 flex flex-col items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-3 opacity-20"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                                <p className="font-medium">Chưa có dữ liệu.</p>
                                <p className="text-xs mt-1 opacity-70">Sử dụng nút Thêm mới/Nhập liệu để tạo bản ghi đầu tiên</p>
                            </div>
                        ) : (
                                <table className="w-full min-w-max text-left border-collapse text-sm border border-slate-200 pb-20">
                                    <thead className="bg-slate-100">
                                        <tr className="text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                                            <th className="px-4 py-3 w-[50px] min-w-[50px] max-w-[50px] sticky left-0 bg-slate-100 z-20 border border-slate-200 text-center shadow-[1px_0_0_0_#e2e8f0]">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                                    onChange={(e) => {
                                                        const currentFilteredIndices = rowData
                                                            .map((item, idx) => {
                                                                const query = searchQuery.toLowerCase();
                                                                let matchesQuery = true;
                                                                if (query) matchesQuery = Object.values(item).some(val => val && String(val).toLowerCase().includes(query));
                                                                let matchesDate = true;
                                                                if (filterDate) {
                                                                    if (activeTab === 'payroll' && item.month) matchesDate = item.month.startsWith(filterDate.substring(0, 7));
                                                                    else matchesDate = item.date === filterDate;
                                                                }
                                                                let matchesType = true;
                                                                if (filterType && activeTab === 'transactions') matchesType = item.type === filterType;
                                                                let matchesStatus = true;
                                                                if (filterStatus && activeTab === 'jobs') matchesStatus = item.status === filterStatus;
                                                                return (matchesQuery && matchesDate && matchesType && matchesStatus) ? idx : -1;
                                                            }).filter(idx => idx !== -1);
                                                        toggleSelectAll(currentFilteredIndices);
                                                    }}
                                                    checked={selectedIds.size > 0 && Array.from(selectedIds).every(id => rowData[id] !== undefined)}
                                                />
                                            </th>
                                            <th className={`px-4 py-3 w-[120px] min-w-[120px] max-w-[120px] sticky left-[50px] bg-slate-100 z-20 border border-slate-200 shadow-[1px_0_0_0_#e2e8f0]`}>Hành động</th>
                                            {activeTab === 'transactions' && (
                                                <>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">Ngày</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">Loại</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">Phân loại</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">Số tiền (VND)</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">Số tiền (RMB)</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">Tỷ giá</th>
                                                    <th className="px-4 py-3 min-w-[200px] border border-slate-200">Ghi chú</th>
                                                </>
                                            )}
                                            {activeTab === 'payroll' && (
                                                <>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">Nhân viên</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">Chức vụ</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">Bộ phận</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">Tháng</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">Ngân hàng</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">Số TK</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200 text-center">Doanh thu (đ)</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">Lương DT (49%) (đ)</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">Phạt (đ)</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">BHXH (đ)</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200 text-indigo-700 font-bold bg-indigo-50 sticky right-0 z-20 shadow-[-1px_0_0_0_#e2e8f0]">Thực lĩnh (đ)</th>
                                                </>
                                            )}
                                            {activeTab === 'jobs' && (
                                                <>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">Mã Job</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">Tên/Dự án</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">Khách hàng</th>
                                                    <th className="px-4 py-3 whitespace-nowrap border border-slate-200">Trạng thái</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rowData.filter(item => {
                                            const query = searchQuery.toLowerCase();
                                            let matchesQuery = true;
                                            if (query) {
                                                matchesQuery = Object.values(item).some(val => val && String(val).toLowerCase().includes(query));
                                            }
                                            let matchesDate = true;
                                            if (filterDate) {
                                                if (activeTab === 'payroll' && item.month) matchesDate = item.month.startsWith(filterDate.substring(0, 7));
                                                else matchesDate = item.date === filterDate;
                                            }
                                            let matchesType = true;
                                            if (filterType && activeTab === 'transactions') matchesType = item.type === filterType;
                                            let matchesStatus = true;
                                            if (filterStatus && activeTab === 'jobs') matchesStatus = item.status === filterStatus;
                                            return matchesQuery && matchesDate && matchesType && matchesStatus;
                                        }).map((row) => {
                                            const originalIndex = rowData.indexOf(row);
                                            const rev = activeTab === 'payroll' ? (row.revenues?.reduce((a: any, b: any) => {
                                                const amt = parseFloat(b.amount || 0);
                                                return a + (b.currency === 'CNY' ? amt * cnyRate : amt);
                                            }, 0) || 0) : 0;
                                            const ratio = rev * 0.49;
                                            const pen = (row.penalties ? row.penalties.reduce((a: any, b: any) => a + parseFloat(b.amount || 0), 0) : 0) + parseFloat(row.penalty || 0);
                                            const ins = 5600000 * 0.105;
                                            const net = ratio - pen - ins;

                                            return (
                                                <tr key={row.id || originalIndex} className="hover:bg-slate-50 transition-colors group bg-white">
                                                    <td className="px-4 py-3 w-[50px] min-w-[50px] max-w-[50px] align-middle sticky left-0 bg-white group-hover:bg-slate-50 z-10 border border-slate-200 shadow-[1px_0_0_0_#e2e8f0] transition-colors text-center">
                                                        <input 
                                                            type="checkbox" 
                                                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                                            checked={selectedIds.has(originalIndex)}
                                                            onChange={() => toggleSelection(originalIndex)}
                                                        />
                                                    </td>
                                                    <td className={`px-4 py-3 ${activeTab === 'payroll' ? 'w-[120px] min-w-[120px] max-w-[120px]' : 'w-[120px] min-w-[120px] max-w-[120px]'} align-middle sticky left-[50px] bg-white group-hover:bg-slate-50 z-10 border border-slate-200 shadow-[1px_0_0_0_#e2e8f0] transition-colors`}>
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => handleEditRow(row, originalIndex)} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 font-bold text-xs transition-colors">Sửa</button>
                                                            <button onClick={() => handleDeleteRow(originalIndex)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 font-bold text-xs transition-colors">Xóa</button>
                                                        </div>
                                                    </td>
                                                    {activeTab === 'transactions' && (
                                                        <>
                                                            <td className="px-4 py-3 text-slate-600 border border-slate-200 whitespace-nowrap">{row.date ? new Date(row.date).toLocaleDateString('vi-VN') : 'N/A'}</td>
                                                            <td className="px-4 py-3 border border-slate-200 whitespace-nowrap"><span className={`px-2 py-1 rounded w-fit text-[11px] font-bold uppercase tracking-wider ${row.type === 'Income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{row.type}</span></td>
                                                            <td className="px-4 py-3 font-semibold text-slate-800 border border-slate-200 whitespace-nowrap">{row.subType || ''}</td>
                                                            <td className="px-4 py-3 font-mono font-medium text-slate-800 border border-slate-200 whitespace-nowrap">{new Intl.NumberFormat('vi-VN').format(row.amountVnd || 0)}</td>
                                                            <td className="px-4 py-3 font-mono font-medium text-slate-800 border border-slate-200 whitespace-nowrap">{new Intl.NumberFormat('vi-VN').format(row.amountRmb || 0)}</td>
                                                            <td className="px-4 py-3 font-mono text-slate-600 border border-slate-200 whitespace-nowrap">{new Intl.NumberFormat('vi-VN').format(row.exchangeRate || 0)}</td>
                                                            <td className="px-4 py-3 text-slate-600 max-w-xs border border-slate-200">{row.description}</td>
                                                        </>
                                                    )}
                                                    {activeTab === 'payroll' && (
                                                        <>
                                                            <td className="px-4 py-3 font-semibold text-slate-800 border border-slate-200 whitespace-nowrap">{row.employeeName}</td>
                                                            <td className="px-4 py-3 text-slate-600 border border-slate-200 whitespace-nowrap">{row.position}</td>
                                                            <td className="px-4 py-3 text-slate-600 border border-slate-200 whitespace-nowrap">{row.department}</td>
                                                            <td className="px-4 py-3 text-slate-600 border border-slate-200 whitespace-nowrap">{row.month}</td>
                                                            <td className="px-4 py-3 text-slate-600 border border-slate-200 whitespace-nowrap">{row.bankName}</td>
                                                            <td className="px-4 py-3 font-mono text-slate-600 border border-slate-200 whitespace-nowrap">{row.bankAccount}</td>
                                                            <td className="px-4 py-3 border border-slate-200 whitespace-nowrap">
                                                                <div className="flex items-center gap-3 justify-center">
                                                                    <span className="font-mono font-bold text-emerald-600">{new Intl.NumberFormat('vi-VN').format(rev)}</span>
                                                                    <div className="flex items-center gap-1">
                                                                        <button onClick={() => openRevenueDetailsModal(row, originalIndex)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition-colors" title="Thêm doanh thu"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
                                                                        <button onClick={() => openRevenueDetailsModal(row, originalIndex)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors" title="Chi tiết"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 font-mono font-medium text-slate-700 border border-slate-200 whitespace-nowrap">{new Intl.NumberFormat('vi-VN').format(ratio)}</td>
                                                            <td className="px-4 py-3 border border-slate-200 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-rose-600">{new Intl.NumberFormat('vi-VN').format(pen)}</span>
                                                                    <button onClick={() => openPenaltyModal(row, originalIndex)} className="p-1 bg-rose-50 text-rose-600 rounded-md hover:bg-rose-100 transition-colors" title="Thêm phạt">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                                    </button>
                                                                </div>
                                                                <div className="text-[10px] text-slate-500 max-w-[120px] truncate" title={row.penalties?.map((p: any) => p.note).filter(Boolean).join(', ') || row.penaltyNote}>
                                                                    {row.penalties?.map((p: any) => p.note).filter(Boolean).join(', ') || row.penaltyNote}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 font-mono text-slate-500 border border-slate-200 whitespace-nowrap">{new Intl.NumberFormat('vi-VN').format(ins)}</td>
                                                            <td className="px-4 py-3 font-mono font-black text-indigo-700 bg-indigo-50 border border-slate-200 whitespace-nowrap sticky right-0 z-10 shadow-[-1px_0_0_0_#e2e8f0] text-lg group-hover:bg-indigo-100 transition-colors">{new Intl.NumberFormat('vi-VN').format(net)}</td>
                                                        </>
                                                    )}
                                                    {activeTab === 'jobs' && (
                                                        <>
                                                            <td className="px-4 py-3 font-bold text-slate-800 border border-slate-200 whitespace-nowrap">{row.jobCode}</td>
                                                            <td className="px-4 py-3 font-semibold text-slate-800 border border-slate-200 whitespace-nowrap">{row.jobName}</td>
                                                            <td className="px-4 py-3 text-slate-600 border border-slate-200 whitespace-nowrap">{row.clientName}</td>
                                                            <td className="px-4 py-3 border border-slate-200 whitespace-nowrap">
                                                                <span className={`px-2 py-1 rounded w-fit text-[11px] font-bold uppercase tracking-wider ${row.status === 'Open' ? 'bg-emerald-100 text-emerald-700' : row.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{row.status}</span>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                        )}
                     </div>
                  </div>
               </div>

            {/* Payroll Modal */}
            {showPayrollForm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800">{editingIndex !== null ? 'Cập Nhật Lương Nhân Viên' : 'Thêm nhân viên'}</h3>
                            <button onClick={() => setShowPayrollForm(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handlePayrollSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-600">Tên nhân viên <span className="text-red-500">*</span></label>
                                    <input required type="text" value={payrollForm.employeeName} onChange={e => setPayrollForm({...payrollForm, employeeName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Nguyễn Văn A" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-600">Tháng <span className="text-red-500">*</span></label>
                                    <input required type="month" value={payrollForm.month} onChange={e => setPayrollForm({...payrollForm, month: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-600">Chức vụ <span className="text-red-500">*</span></label>
                                    <input required type="text" value={payrollForm.position} onChange={e => setPayrollForm({...payrollForm, position: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Nhân viên" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-600">Bộ phận <span className="text-red-500">*</span></label>
                                    <input required type="text" value={payrollForm.department} onChange={e => setPayrollForm({...payrollForm, department: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Kinh doanh" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-600">Ngân hàng <span className="text-red-500">*</span></label>
                                    <input required type="text" value={payrollForm.bankName} onChange={e => setPayrollForm({...payrollForm, bankName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Techcombank" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-600">Số tài khoản <span className="text-red-500">*</span></label>
                                    <input required type="text" value={payrollForm.bankAccount} onChange={e => setPayrollForm({...payrollForm, bankAccount: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="1900xxxx" />
                                </div>
                            </div>
                            
                            <hr className="my-2 border-slate-100" />

                            <div className="bg-primary-50 p-4 rounded-xl mt-2 flex flex-col gap-1 border border-primary-100">
                                <p className="text-sm text-primary-800 font-medium">Bảo hiểm 10.5% (tính trên 5.600.000): -588.000 VND</p>
                            </div>

                            <div className="mt-4 flex gap-3 justify-end">
                                <button type="button" onClick={() => setShowPayrollForm(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                                    Huỷ bỏ
                                </button>
                                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-200 hover:-translate-y-0.5 transition-all">
                                    {editingIndex !== null ? 'Cập Nhật' : 'Xác Nhận & Thêm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transaction Modal */}
            {showTransactionForm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800">{editingIndex !== null ? 'Cập Nhật Giao Dịch' : 'Thêm Giao Dịch'}</h3>
                            <button onClick={() => setShowTransactionForm(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleTransactionSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-600">Ngày <span className="text-red-500">*</span></label>
                                    <input required type="date" value={transactionForm.date} onChange={e => setTransactionForm({...transactionForm, date: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-600">Loại (Income/Expense)</label>
                                    <select value={transactionForm.type} onChange={e => setTransactionForm({...transactionForm, type: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                                        <option value="Income">Income</option>
                                        <option value="Expense">Expense</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-600">Phân loại</label>
                                    <input type="text" value={transactionForm.subType} onChange={e => setTransactionForm({...transactionForm, subType: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-600">Số tiền (VND)</label>
                                    <input type="number" value={transactionForm.amountVnd} onChange={e => setTransactionForm({...transactionForm, amountVnd: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-600">Số tiền (RMB)</label>
                                    <input type="number" value={transactionForm.amountRmb} onChange={e => setTransactionForm({...transactionForm, amountRmb: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-600">Tỷ giá áp dụng</label>
                                    <input type="number" value={transactionForm.exchangeRate} onChange={e => setTransactionForm({...transactionForm, exchangeRate: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono" />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-sm font-semibold text-slate-600">Ghi chú</label>
                                    <input type="text" value={transactionForm.description} onChange={e => setTransactionForm({...transactionForm, description: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                                </div>
                            </div>
                            <div className="mt-4 flex gap-3 justify-end">
                                <button type="button" onClick={() => setShowTransactionForm(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Huỷ bỏ</button>
                                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-200 hover:-translate-y-0.5 transition-all">Lưu Giao Dịch</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Job Modal */}
            {showJobForm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800">{editingIndex !== null ? 'Cập Nhật Dự Án' : 'Thêm Dự Án'}</h3>
                            <button onClick={() => setShowJobForm(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleJobSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-600">Mã Job <span className="text-red-500">*</span></label>
                                    <input required type="text" value={jobForm.jobCode} onChange={e => setJobForm({...jobForm, jobCode: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-600">Tên/Dự án <span className="text-red-500">*</span></label>
                                    <input required type="text" value={jobForm.jobName} onChange={e => setJobForm({...jobForm, jobName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-600">Khách hàng</label>
                                    <input type="text" value={jobForm.clientName} onChange={e => setJobForm({...jobForm, clientName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-600">Trạng thái</label>
                                    <select value={jobForm.status} onChange={e => setJobForm({...jobForm, status: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                                        <option value="Open">Open</option>
                                        <option value="Closed">Closed</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-3 justify-end">
                                <button type="button" onClick={() => setShowJobForm(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Huỷ bỏ</button>
                                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-200 hover:-translate-y-0.5 transition-all">Lưu Dự Án</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Revenues Modal */}
            {showRevenuesModal && selectedPayrollIndex !== null && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-in max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800">
                                Doanh thu nhân viên: {rowData[selectedPayrollIndex]?.employeeName}
                            </h3>
                            <button onClick={() => {
                                setShowRevenuesModal(false);
                                setEditingRevenueIndex(null);
                                setRevenueForm({
                                    contractCode: '',
                                    jobName: '',
                                    revenuePosition: '',
                                    currency: 'VND',
                                    amount: '',
                                    collectionDate: new Date().toISOString().slice(0, 10),
                                    collectionPhase: 'Phase 1'
                                });
                            }} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
                            <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                <p className="text-sm font-semibold text-primary-700">Tổng doanh thu hiện tại</p>
                                <p className="text-3xl font-black text-primary-600 mt-1">
                                    {new Intl.NumberFormat('vi-VN').format(
                                        rowData[selectedPayrollIndex]?.revenues?.reduce((a: number, b: any) => a + parseFloat(b.amount || 0), 0) || 0
                                    )} đ
                                </p>
                            </div>
                            
                            {/* Revenue list */}
                            <div className="flex flex-col gap-3">
                                <h4 className="font-bold text-slate-700">Các khoản doanh thu hiện tại</h4>
                                {(!rowData[selectedPayrollIndex]?.revenues || rowData[selectedPayrollIndex]?.revenues.length === 0) ? (
                                    <p className="text-sm text-slate-500 italic">Chưa có khoản doanh thu nào.</p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {rowData[selectedPayrollIndex]?.revenues.map((r: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-start bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                <div>
                                                    <p className="font-semibold text-sm text-slate-800">{r.contractCode} - {r.jobName}</p>
                                                    <p className="text-xs text-slate-500 mt-1">Vị trí: <span className="font-medium text-slate-700">{r.revenuePosition}</span> | Giai đoạn: <span className="font-medium text-slate-700">{r.collectionPhase}</span></p>
                                                    <p className="text-xs text-slate-500">Số tiền: <span className="font-bold text-indigo-600">{new Intl.NumberFormat('vi-VN').format(r.amount || 0)} {r.currency}</span> | Ngày thu: <span className="font-medium text-slate-700">{r.collectionDate ? new Date(r.collectionDate).toLocaleDateString('vi-VN') : 'N/A'}</span></p>
                                                    {r.timestamp && <p className="text-[10px] text-slate-400 mt-0.5">Cập nhật: {new Date(r.timestamp).toLocaleString('vi-VN')}</p>}
                                                </div>
                                                <div className="flex flex-col gap-1 sm:flex-row">
                                                    <button onClick={() => {
                                                        setEditingRevenueIndex(idx);
                                                        setRevenueForm({
                                                            contractCode: r.contractCode || '',
                                                            jobName: r.jobName || '',
                                                            revenuePosition: r.revenuePosition || '',
                                                            currency: r.currency || 'VND',
                                                            amount: r.amount ? new Intl.NumberFormat('vi-VN').format(r.amount) : '',
                                                            collectionDate: r.collectionDate || new Date().toISOString().slice(0, 10),
                                                            collectionPhase: r.collectionPhase || 'Phase 1'
                                                        });
                                                    }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa doanh thu">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                                                    </button>
                                                    <button onClick={() => {
                                                        executeConfirm(
                                                            'Xác nhận xóa doanh thu',
                                                            <div className="text-sm text-slate-600">
                                                                <p className="mb-3 text-base">Bạn có chắc chắn muốn xóa doanh thu này không?</p>
                                                                <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-red-800 font-medium">
                                                                    <p><strong>Dự án:</strong> {r.jobName} ({r.contractCode})</p>
                                                                    <p><strong>Số tiền:</strong> {new Intl.NumberFormat('vi-VN').format(r.amount || 0)} {r.currency}</p>
                                                                </div>
                                                            </div>,
                                                            () => {
                                                                const newData = [...rowData];
                                                                newData[selectedPayrollIndex].revenues.splice(idx, 1);
                                                                setRowData(newData);
                                                                handleSaveAll(newData, activeTab, true);
                                                                setConfirmModal(null);
                                                                showNotification('Đã xóa doanh thu', 'info');
                                                            }
                                                        );
                                                    }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa doanh thu">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <hr className="border-slate-100" />
                            
                            <form onSubmit={handleAddRevenue} className="flex flex-col gap-4">
                                <h4 className="font-bold text-slate-700">{editingRevenueIndex !== null ? 'Cập nhật doanh thu' : 'Thêm doanh thu mới'}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-600">Mã hợp đồng</label>
                                        <input required type="text" value={revenueForm.contractCode} onChange={e => setRevenueForm({...revenueForm, contractCode: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="CCT-001" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-600">Tên Job</label>
                                        <input required type="text" value={revenueForm.jobName} onChange={e => setRevenueForm({...revenueForm, jobName: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Báo cáo thuế T5" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-600">Vị trí thu</label>
                                        <input required type="text" value={revenueForm.revenuePosition} onChange={e => setRevenueForm({...revenueForm, revenuePosition: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Ví dụ: Kế toán trưởng" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-600">Tiền tệ</label>
                                        <select value={revenueForm.currency} onChange={e => setRevenueForm({...revenueForm, currency: e.target.value as any})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                                            <option value="VND">VNĐ</option>
                                            <option value="RMB">RMB (Nhân dân tệ)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-sm font-semibold text-slate-600">Số tiền ({revenueForm.currency})</label>
                                        <input required type="text" value={revenueForm.amount} onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            const formatted = val ? new Intl.NumberFormat('vi-VN').format(Number(val)) : '';
                                            setRevenueForm({...revenueForm, amount: formatted});
                                        }} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono" placeholder="5,000,000" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-600">Ngày thu</label>
                                        <input required type="date" value={revenueForm.collectionDate} onChange={e => setRevenueForm({...revenueForm, collectionDate: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-600">Giai đoạn thu</label>
                                        <select value={revenueForm.collectionPhase} onChange={e => setRevenueForm({...revenueForm, collectionPhase: e.target.value as any})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                                            <option value="Phase 1">Phase 1</option>
                                            <option value="Phase 2">Phase 2</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-2 flex justify-end gap-3">
                                    {editingRevenueIndex !== null && (
                                        <button type="button" onClick={() => {
                                            setEditingRevenueIndex(null);
                                            setRevenueForm({ 
                                                contractCode: '', 
                                                jobName: '', 
                                                revenuePosition: '', 
                                                currency: 'VND', 
                                                amount: '', 
                                                collectionDate: new Date().toISOString().slice(0, 10), 
                                                collectionPhase: 'Phase 1' 
                                            });
                                        }} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                                            Hủy Cập Nhật
                                        </button>
                                    )}
                                    <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-200 hover:-translate-y-0.5 transition-all">
                                        {editingRevenueIndex !== null ? 'Lưu Thay Đổi' : 'Thêm Doanh Thu'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Penalty Modal */}
            {showPenaltyModal && selectedPayrollIndex !== null && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-scale-in max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800">
                                Quản lý tiền phạt - {rowData[selectedPayrollIndex]?.employeeName}
                            </h3>
                            <button onClick={() => setShowPenaltyModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
                            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                <p className="text-sm font-semibold text-rose-700">Tổng tiền phạt hiện tại</p>
                                <p className="text-3xl font-black text-rose-600 mt-1">
                                    {new Intl.NumberFormat('vi-VN').format(
                                        (rowData[selectedPayrollIndex]?.penalties?.reduce((a: number, b: any) => a + parseFloat(b.amount || 0), 0) || 0) + parseFloat(rowData[selectedPayrollIndex]?.penalty || 0)
                                    )} đ
                                </p>
                            </div>
                            
                            {/* Penalty list */}
                            <div className="flex flex-col gap-3">
                                <h4 className="font-bold text-slate-700">Các khoản phạt hiện tại</h4>
                                {(!rowData[selectedPayrollIndex]?.penalties || rowData[selectedPayrollIndex]?.penalties.length === 0) ? (
                                    <p className="text-sm text-slate-500 italic">Chưa có khoản phạt nào.</p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {rowData[selectedPayrollIndex]?.penalties.map((p: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-start bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                <div>
                                                    <p className="font-semibold text-sm text-slate-800">{new Intl.NumberFormat('vi-VN').format(p.amount || 0)} VND</p>
                                                    {p.note && <p className="text-xs text-slate-500 mt-1">Ghi chú: {p.note}</p>}
                                                </div>
                                                <div className="flex flex-col gap-1 sm:flex-row">
                                                    <button onClick={() => {
                                                        setEditingPenaltyIndex(idx);
                                                        setPenaltyForm({
                                                            amount: p.amount ? new Intl.NumberFormat('vi-VN').format(p.amount) : '',
                                                            note: p.note || ''
                                                        });
                                                    }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa khoản phạt">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                                                    </button>
                                                    <button onClick={() => {
                                                        executeConfirm(
                                                            'Xác nhận xóa khoản phạt',
                                                            <div className="text-sm text-slate-600">
                                                                <p className="mb-3 text-base">Bạn có chắc chắn muốn xóa khoản phạt này không?</p>
                                                                <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-red-800 font-medium">
                                                                    <p><strong>Số tiền:</strong> {new Intl.NumberFormat('vi-VN').format(p.amount || 0)} VND</p>
                                                                </div>
                                                            </div>,
                                                            () => {
                                                                const newData = [...rowData];
                                                                newData[selectedPayrollIndex].penalties.splice(idx, 1);
                                                                setRowData(newData);
                                                                handleSaveAll(newData, activeTab, true);
                                                                setConfirmModal(null);
                                                                showNotification('Đã xóa khoản phạt', 'info');
                                                            }
                                                        );
                                                    }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa khoản phạt">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <hr className="border-slate-100" />

                            <form onSubmit={handleAddPenalty} className="flex flex-col gap-4">
                                <h4 className="font-bold text-slate-700">{editingPenaltyIndex !== null ? 'Cập nhật khoản phạt' : 'Thêm khoản phạt mới'}</h4>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-600">Số tiền phạt (VND)</label>
                                    <input required type="text" value={penaltyForm.amount} onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        const formatted = val ? new Intl.NumberFormat('vi-VN').format(Number(val)) : '';
                                        setPenaltyForm({...penaltyForm, amount: formatted});
                                    }} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono" placeholder="Ví dụ: 100,000" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-600">Ghi chú phạt</label>
                                    <textarea value={penaltyForm.note} onChange={e => setPenaltyForm({...penaltyForm, note: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all min-h-[100px]" placeholder="Đi trễ, vi phạm nội quy,..." />
                                </div>
                                <div className="mt-2 flex justify-end gap-3">
                                    {editingPenaltyIndex !== null && (
                                        <button type="button" onClick={() => {
                                            setEditingPenaltyIndex(null);
                                            setPenaltyForm({ amount: '', note: '' });
                                        }} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                                            Hủy Cập Nhật
                                        </button>
                                    )}
                                    <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 hover:-translate-y-0.5 transition-all">
                                        {editingPenaltyIndex !== null ? 'Lưu Thay Đổi' : 'Thêm Khoản Phạt'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Confirm Modal */}
            {confirmModal?.isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-scale-in">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">{confirmModal.title}</h3>
                        </div>
                        <div className="p-6">
                            {confirmModal.message}
                            <div className="mt-6 flex gap-3 justify-end">
                                <button type="button" onClick={() => setConfirmModal(null)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                                    Hủy
                                </button>
                                <button type="button" onClick={confirmModal.onConfirm} className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:-translate-y-0.5 transition-all">
                                    Xác nhận
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
