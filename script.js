const API_URL = '/api/users';
let mockUsers = [];

// Fetch users from API
async function fetchUsers() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        mockUsers = await response.json();
        renderUsers();
        if (typeof renderAdminList === 'function' && document.getElementById('adminModal') && !document.getElementById('adminModal').classList.contains('hidden')) {
            renderAdminList();
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        mockUsers = [];
        renderUsers();
    }
}

const userGrid = document.getElementById('userGrid');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const totalCount = document.getElementById('totalCount');

let currentFilter = 'all';
let searchQuery = '';

const adminModal = document.getElementById('adminModal');
const openAdminBtn = document.getElementById('openAdminBtn');
const closeAdminBtn = document.getElementById('closeAdminBtn');
const addMemberForm = document.getElementById('addMemberForm');
const adminUserList = document.getElementById('adminUserList');

// Function to render user cards
function renderUsers() {
    // Filter users based on search and group
    const filteredUsers = mockUsers.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.group.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = currentFilter === 'all' || user.group === currentFilter;
        return matchesSearch && matchesFilter;
    });

    // Update count
    totalCount.textContent = filteredUsers.length;

    // Clear grid
    userGrid.innerHTML = '';

    if (filteredUsers.length === 0) {
        userGrid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-users-slash"></i>
                <p>ไม่พบรายชื่อบุคลากรที่ค้นหา</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem; filter: opacity(0.7);">ลองค้นหาด้วยคำอื่น หรือกดดูทั้งหมด</p>
            </div>
        `;
        return;
    }

    // Render cards
    filteredUsers.forEach((user, index) => {
        const card = document.createElement('div');
        card.className = 'user-card';
        // Add subtle staggered animation
        card.style.animationDelay = `${index * 0.05}s`;

        // Make the entire card clickable if Facebook link exists
        if (user.facebook && user.facebook.trim() !== '') {
            card.style.cursor = 'pointer';
            card.title = "คลิกเพื่อไปยัง Facebook";
            card.onclick = () => window.open(user.facebook, '_blank');
        }

        card.innerHTML = `
            <div class="avatar-container">
                <img src="${user.avatar}" alt="${user.name}" class="avatar" loading="lazy">
            </div>
            <div class="user-info" style="margin-right: 10px;">
                <div class="user-name">${user.name} <span style="font-size: 0.75rem; color: var(--primary-color); font-weight: 600; margin-left: 0.5rem; text-transform: uppercase;">${user.group === 'Head' ? '<i class="fa-solid fa-crown"></i>' : ''}</span></div>
                <div class="user-role" style="font-size: 0.95rem;">
                    <i class="fa-solid ${user.icon}"></i> <strong>${user.group}</strong>
                </div>
            </div>
        `;
        userGrid.appendChild(card);
    });
}

// Initial render
document.addEventListener('DOMContentLoaded', fetchUsers);

// Search event listener
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderUsers();
});

// Filter event listeners
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        filterBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked
        btn.classList.add('active');
        // Update filter and render
        currentFilter = btn.getAttribute('data-filter');
        renderUsers();
    });
});

// Welcome Screen Logic
const welcomeScreen = document.getElementById('welcomeScreen');
const mainApp = document.getElementById('mainApp');
const enterBtn = document.getElementById('enterBtn');

enterBtn.addEventListener('click', () => {
    // Fade out welcome screen
    welcomeScreen.classList.add('hidden');

    // Show main app after a slight delay
    setTimeout(() => {
        mainApp.style.display = 'flex';
        // Trigger reflow to ensure transition works
        void mainApp.offsetWidth;
        mainApp.style.opacity = '1';
    }, 400); // slightly before the fade out ends for a smoother transition
});

// ====== Admin Panel Logic ======

let currentAdminPassword = "";

// Open / Close Modal
if (openAdminBtn) {
    openAdminBtn.addEventListener('click', () => {
        const pwd = prompt("กรุณาใส่รหัสผ่านเพื่อเข้าสู่ระบบแอดมิน");
        if (pwd === "kruapo08012552") {
            currentAdminPassword = pwd;
            adminModal.classList.remove('hidden');
            renderAdminList();
        } else if (pwd !== null) {
            alert("รหัสผ่านไม่ถูกต้อง!");
        }
    });
}

if (closeAdminBtn) {
    closeAdminBtn.addEventListener('click', () => {
        adminModal.classList.add('hidden');
    });
}

// Render Admin List
function renderAdminList() {
    if (!adminUserList) return;
    adminUserList.innerHTML = '';
    mockUsers.forEach(user => {
        const item = document.createElement('div');
        item.className = 'admin-user-item';
        item.innerHTML = `
            <div class="admin-user-item-info">
                <img src="${user.avatar}" alt="${user.name}">
                <div>
                    <div style="color: white; font-weight: 500;">${user.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${user.group}</div>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="admin-edit-btn" onclick="editUser(${user.id})" style="background: var(--primary-color); color: black; border: none; padding: 5px 12px; border-radius: 5px; cursor: pointer; font-family: 'Prompt'; font-size: 0.85rem; transition: 0.2s;"><i class="fa-solid fa-pen"></i></button>
                <button class="admin-delete-btn" onclick="deleteUser(${user.id})">ลบ</button>
            </div>
        `;
        adminUserList.appendChild(item);
    });
}

// Add or Edit User
if (addMemberForm) {
    addMemberForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('editMemberId') ? document.getElementById('editMemberId').value : '';
        const name = document.getElementById('memberName').value;
        const group = document.getElementById('memberGroup').value;
        const avatar = document.getElementById('memberAvatar').value;
        const facebook = document.getElementById('memberFacebook').value;

        const userData = {
            name: name,
            group: group,
            avatar: avatar,
            facebook: facebook,
            icon: group === 'Head' ? 'fa-crown' : 'fa-user'
        };

        try {
            if (editId) {
                // Update
                await fetch(`${API_URL}/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'x-admin-password': currentAdminPassword },
                    body: JSON.stringify(userData)
                });
            } else {
                // Add
                await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-admin-password': currentAdminPassword },
                    body: JSON.stringify(userData)
                });
            }
            await fetchUsers(); // Refresh the list
            closeEditMode();  // Reset form and mode
        } catch (error) {
            console.error('Error saving user:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกรายชื่อ กรุณาตรวจสอบให้แน่ใจว่าเซิร์ฟเวอร์เปิดอยู่');
        }
    });
}

function closeEditMode() {
    if (addMemberForm) addMemberForm.reset();
    if (document.getElementById('editMemberId')) {
        document.getElementById('editMemberId').value = '';
        document.getElementById('submitMemberBtn').innerHTML = '<i class="fa-solid fa-plus"></i> เพิ่มรายชื่อ';
        document.getElementById('cancelEditBtn').classList.add('hidden');
    }
}

if (document.getElementById('cancelEditBtn')) {
    document.getElementById('cancelEditBtn').addEventListener('click', closeEditMode);
}

// Edit User globally
window.editUser = function (id) {
    const user = mockUsers.find(u => u.id === id);
    if (!user) return;

    document.getElementById('editMemberId').value = user.id;
    document.getElementById('memberName').value = user.name;
    document.getElementById('memberGroup').value = user.group;
    document.getElementById('memberAvatar').value = user.avatar;
    document.getElementById('memberFacebook').value = user.facebook || '';

    document.getElementById('submitMemberBtn').innerHTML = '<i class="fa-solid fa-save"></i> บันทึกการแก้ไข';
    document.getElementById('cancelEditBtn').classList.remove('hidden');

    // Scroll to top of modal smooth
    document.querySelector('.modal-content').scrollTo({ top: 0, behavior: 'smooth' });
};

// Delete User (Available globally)
window.deleteUser = async function (id) {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบรายชื่อนี้?')) {
        try {
            await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-password': currentAdminPassword }
            });
            await fetchUsers(); // Refresh the list
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('เกิดข้อผิดพลาดในการลบรายชื่อ กรุณาตรวจสอบให้แน่ใจว่าเซิร์ฟเวอร์เปิดอยู่');
        }
    }
};
