const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

const notificationState = `
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };
`;

code = code.replace(/const \[confirmModal, setConfirmModal\] = useState\[\^;\]\+;/, `$&${notificationState}`);
// The above regex might be bad with escape. Let's fix.
code = code.replace(/const \[confirmModal, setConfirmModal\] = useState[^\n]+;/, (match) => match + '\n' + notificationState);


const notificationUI = `
                    {/* Toast Notification */}
                    {notification && (
                        <div className={\`fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-xl shadow-lg border animate-fade-in-up flex items-center gap-3 \${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}\`}>
                            {notification.type === 'success' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                            <span className="font-semibold text-sm">{notification.message}</span>
                        </div>
                    )}
`;

code = code.replace(/\{confirmModal && \(/, `${notificationUI}\n                    {confirmModal && (`);

code = code.replace(/await fetch\(\`\/api\/admin\/users\/\$\{uid\}\/lock\`,[\s\S]*?\);(\s*)fetchGlobalData\(\);(\s*)\} catch \(e\) \{(\s*)(console\.error\('Error locking\/unlocking user', e\);)/, 
    (m, s1, s2, s3, s4) => `await fetch(\`/api/admin/users/\${uid}/lock\`, { 
                        method: 'PUT', 
                        headers: { ...headers, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isLocked: !isCurrentlyLocked })
                    });${s1}fetchGlobalData();${s1}showNotification(isCurrentlyLocked ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');${s2}} catch (e) {${s3}showNotification('Có lỗi xảy ra', 'error');${s3}${s4}`
);

code = code.replace(/await fetch\(\`\/api\/admin\/users\/\$\{uid\}\`, {[\s]*method: 'DELETE',[\s]*headers[\s]*}\);(\s*)fetchGlobalData\(\);(\s*)\} catch \(e\) \{(\s*)(console\.error\('Error deleting user', e\);)/, 
    (m, s1, s2, s3, s4) => `await fetch(\`/api/admin/users/\${uid}\`, { method: 'DELETE', headers });${s1}fetchGlobalData();${s1}showNotification('Đã xóa người dùng thành công');${s2}} catch (e) {${s3}showNotification('Xóa người dùng thất bại', 'error');${s3}${s4}`
);

code = code.replace(/await fetch\(\`\/api\/admin\/user-details\/\$\{uid\}\/chats\/\$\{sessionId\}\`, { method: 'DELETE', headers }\);(\s*)fetchUserDetails\(uid\);(\s*)fetchGlobalData\(\);(\s*)\} catch \(e\) \{\}/,
    (m, s1, s2, s3) => `await fetch(\`/api/admin/user-details/\${uid}/chats/\${sessionId}\`, { method: 'DELETE', headers });${s1}fetchUserDetails(uid);${s2}fetchGlobalData();${s2}showNotification('Đã xóa lịch sử chat');${s3}} catch (e) { showNotification('Xóa lịch sử chat thất bại', 'error'); }`
);

code = code.replace(/await fetch\(\`\/api\/admin\/user-details\/\$\{uid\}\/notes\/\$\{noteId\}\`, { method: 'DELETE', headers }\);(\s*)fetchUserDetails\(uid\);(\s*)fetchGlobalData\(\);(\s*)\} catch \(e\) \{\}/,
    (m, s1, s2, s3) => `await fetch(\`/api/admin/user-details/\${uid}/notes/\${noteId}\`, { method: 'DELETE', headers });${s1}fetchUserDetails(uid);${s2}fetchGlobalData();${s2}showNotification('Đã xóa ghi chú');${s3}} catch (e) { showNotification('Xóa ghi chú thất bại', 'error'); }`
);

code = code.replace(/await fetch\(\`\/api\/admin\/user-details\/\$\{uid\}\/tags\/\$\{tagId\}\`, { method: 'DELETE', headers }\);(\s*)fetchUserDetails\(uid\);(\s*)fetchGlobalData\(\);(\s*)\} catch \(e\) \{\}/,
    (m, s1, s2, s3) => `await fetch(\`/api/admin/user-details/\${uid}/tags/\${tagId}\`, { method: 'DELETE', headers });${s1}fetchUserDetails(uid);${s2}fetchGlobalData();${s2}showNotification('Đã xóa thẻ ghi chú');${s3}} catch (e) { showNotification('Xóa thẻ thất bại', 'error'); }`
);

code = code.replace(/await fetch\(\`\/api\/admin\/user-details\/\$\{uid\}\/conversions\/\$\{conversionId\}\`, { method: 'DELETE', headers }\);(\s*)fetchUserDetails\(uid\);(\s*)fetchGlobalData\(\);(\s*)\} catch \(e\) \{\}/,
    (m, s1, s2, s3) => `await fetch(\`/api/admin/user-details/\${uid}/conversions/\${conversionId}\`, { method: 'DELETE', headers });${s1}fetchUserDetails(uid);${s2}fetchGlobalData();${s2}showNotification('Đã xóa chuyển đổi tệ');${s3}} catch (e) { showNotification('Xóa chuyển đổi tệ thất bại', 'error'); }`
);

code = code.replace(/await fetch\(\`\/api\/admin\/user-details\/\$\{uid\}\/stats\/\$\{statId\}\`, { method: 'DELETE', headers }\);(\s*)fetchUserDetails\(uid\);(\s*)fetchGlobalData\(\);(\s*)\} catch \(e\) \{\}/,
    (m, s1, s2, s3) => `await fetch(\`/api/admin/user-details/\${uid}/stats/\${statId}\`, { method: 'DELETE', headers });${s1}fetchUserDetails(uid);${s2}fetchGlobalData();${s2}showNotification('Đã xóa thống kê');${s3}} catch (e) { showNotification('Xóa thống kê thất bại', 'error'); }`
);

code = code.replace(/fetchGlobalData\(\);(\s*)\} catch \(e\) \{(\s*)console\.error\('Lỗi khi xóa hàng loạt:', e\);/,
    (m, s1, s2) => `fetchGlobalData();${s1}showNotification('Đã xóa hàng loạt thành công');${s1}} catch (e) {${s2}showNotification('Xóa hàng loạt thất bại', 'error');${s2}console.error('Lỗi khi xóa hàng loạt:', e);`
);

fs.writeFileSync('components/AdminDashboard.tsx', code);
