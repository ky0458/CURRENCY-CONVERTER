const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

const functionsToFix = [
    { start: 'const toggleLockUser', argMatch: /const toggleLockUser\s*=\s*(async\s*\(.*?\)\s*=>\s*\{)([\s\S]*?)console\.error\(\`Error locking\/unlocking user\`, e\);\n\s*\}\n\s*\};/m },
    { start: 'const deleteChat', argMatch: /const deleteChat\s*=\s*(async\s*\(.*?\)\s*=>\s*\{)([\s\S]*?)catch\s*\(e\)\s*\{\}\n\s*\};/m },
    { start: 'const deleteNote', argMatch: /const deleteNote\s*=\s*(async\s*\(.*?\)\s*=>\s*\{)([\s\S]*?)catch\s*\(e\)\s*\{\}\n\s*\};/m },
    { start: 'const deleteTag', argMatch: /const deleteTag\s*=\s*(async\s*\(.*?\)\s*=>\s*\{)([\s\S]*?)catch\s*\(e\)\s*\{\}\n\s*\};/m },
    { start: 'const deleteConversion', argMatch: /const deleteConversion\s*=\s*(async\s*\(.*?\)\s*=>\s*\{)([\s\S]*?)catch\s*\(e\)\s*\{\}\n\s*\};/m },
    { start: 'const deleteStat', argMatch: /const deleteStat\s*=\s*(async\s*\(.*?\)\s*=>\s*\{)([\s\S]*?)catch\s*\(e\)\s*\{\}\n\s*\};/m },
    { start: 'const deleteModel', argMatch: /const deleteModel\s*=\s*(async\s*\(.*?\)\s*=>\s*\{)([\s\S]*?)catch\s*\(e\)\s*\{\}\n\s*\};/m }
];

// Let's rewrite manually by regex:
// 1. toggleLockUser
code = code.replace(
    /const toggleLockUser = async \(uid: string, isCurrentlyLocked: boolean\) => \{[\s\S]*?console\.error\(\`Error locking\/unlocking user\`, e\);\n\s*\}\n\s*\};/,
    `const toggleLockUser = (uid: string, isCurrentlyLocked: boolean) => {
        const actionText = isCurrentlyLocked ? 'MỞ KHÓA' : 'KHÓA';
        setConfirmModal({
            isOpen: true,
            text: \`Bạn có chắc chắn muốn \${actionText} người dùng này không?\`,
            onConfirm: async () => {
                try {
                    await fetch(\`/api/admin/users/\${uid}/lock\`, { 
                        method: 'PUT', 
                        headers: { ...headers, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isLocked: !isCurrentlyLocked })
                    });
                    fetchGlobalData();
                } catch (e) {
                    console.error('Error locking/unlocking user', e);
                }
            }
        });
    };`
);

// 2. deleteChat
code = code.replace(
    /const deleteChat = async \(uid: string, sessionId: string\) => \{[\s\S]*?catch \(e\) \{\}\n\s*\};/,
    `const deleteChat = (uid: string, sessionId: string) => {
        setConfirmModal({
            isOpen: true,
            text: 'Xoá lịch sử chat này?',
            onConfirm: async () => {
                try {
                    await fetch(\`/api/admin/user-details/\${uid}/chats/\${sessionId}\`, { method: 'DELETE', headers });
                    fetchUserDetails(uid);
                    fetchGlobalData();
                } catch (e) {}
            }
        });
    };`
);

// 3. deleteNote
code = code.replace(
    /const deleteNote = async \(uid: string, noteId: string\) => \{[\s\S]*?catch \(e\) \{\}\n\s*\};/,
    `const deleteNote = (uid: string, noteId: string) => {
        setConfirmModal({
            isOpen: true,
            text: 'Xoá ghi chú này?',
            onConfirm: async () => {
                try {
                    await fetch(\`/api/admin/user-details/\${uid}/notes/\${noteId}\`, { method: 'DELETE', headers });
                    fetchUserDetails(uid);
                    fetchGlobalData();
                } catch (e) {}
            }
        });
    };`
);

// 4. deleteTag
code = code.replace(
    /const deleteTag = async \(uid: string, tagId: string\) => \{[\s\S]*?catch \(e\) \{\}\n\s*\};/,
    `const deleteTag = (uid: string, tagId: string) => {
        setConfirmModal({
            isOpen: true,
            text: 'Xoá thẻ ghi chú này?',
            onConfirm: async () => {
                try {
                    await fetch(\`/api/admin/user-details/\${uid}/tags/\${tagId}\`, { method: 'DELETE', headers });
                    fetchUserDetails(uid);
                    fetchGlobalData();
                } catch (e) {}
            }
        });
    };`
);

// 5. deleteConversion
code = code.replace(
    /const deleteConversion = async \(uid: string, conversionId: string\) => \{[\s\S]*?catch \(e\) \{\}\n\s*\};/,
    `const deleteConversion = (uid: string, conversionId: string) => {
        setConfirmModal({
            isOpen: true,
            text: 'Xoá lịch sử chuyển đổi này?',
            onConfirm: async () => {
                try {
                    await fetch(\`/api/admin/user-details/\${uid}/conversions/\${conversionId}\`, { method: 'DELETE', headers });
                    fetchUserDetails(uid);
                    fetchGlobalData();
                } catch (e) {}
            }
        });
    };`
);

// 6. deleteStat
code = code.replace(
    /const deleteStat = async \(uid: string, statId: string\) => \{[\s\S]*?catch \(e\) \{\}\n\s*\};/,
    `const deleteStat = (uid: string, statId: string) => {
        setConfirmModal({
            isOpen: true,
            text: 'Xoá lịch sử thống kê doanh thu này?',
            onConfirm: async () => {
                try {
                    await fetch(\`/api/admin/user-details/\${uid}/stats/\${statId}\`, { method: 'DELETE', headers });
                    fetchUserDetails(uid);
                    fetchGlobalData();
                } catch (e) {}
            }
        });
    };`
);

// 7. deleteModel
code = code.replace(
    /const deleteModel = async \(id: string\) => \{[\s\S]*?catch \(e\) \{\}\n\s*\};/,
    `const deleteModel = (id: string) => {
        setConfirmModal({
            isOpen: true,
            text: 'Xoá AI model này khỏi hệ thống?',
            onConfirm: async () => {
                try {
                    await fetch(\`/api/admin/models/\${id}\`, { method: 'DELETE', headers });
                    fetchGlobalData();
                } catch (e) {}
            }
        });
    };`
);

fs.writeFileSync('components/AdminDashboard.tsx', code);
