// ApexNet - Современный мессенджер
// LocalStorage-based demo версия

let currentUser = null;
let currentChat = null;
let users = [];
let chats = [];
let messages = {};

// Инициализация
function init() {
  loadData();
  
  if (currentUser) {
    if (window.location.pathname.includes('/admin') && currentUser.isAdmin) {
      showScreen('adminScreen');
      loadAdminData();
    } else {
      showScreen('mainScreen');
      loadChats();
    }
  } else {
    showScreen('authScreen');
  }
}

// Загрузка данных из localStorage
function loadData() {
  users = JSON.parse(localStorage.getItem('apexnet_users') || '[]');
  chats = JSON.parse(localStorage.getItem('apexnet_chats') || '[]');
  messages = JSON.parse(localStorage.getItem('apexnet_messages') || '{}');
  currentUser = JSON.parse(localStorage.getItem('apexnet_current_user') || 'null');
  
  // Создаём админа если нет
  if (users.length === 0) {
    users.push({
      id: 1,
      name: 'Администратор',
      username: 'admin',
      password: '123',
      bio: 'Создатель ApexNet',
      avatar: null,
      verified: true,
      premium: true,
      isAdmin: true,
      createdAt: Date.now()
    });
    saveData();
  }
}

// Сохранение данных
function saveData() {
  localStorage.setItem('apexnet_users', JSON.stringify(users));
  localStorage.setItem('apexnet_chats', JSON.stringify(chats));
  localStorage.setItem('apexnet_messages', JSON.stringify(messages));
  localStorage.setItem('apexnet_current_user', JSON.stringify(currentUser));
}

// Переключение экранов
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

// === АВТОРИЗАЦИЯ ===

function showLogin() {
  document.getElementById('loginForm').classList.add('active');
  document.getElementById('registerForm').classList.remove('active');
}

function showRegister() {
  document.getElementById('loginForm').classList.remove('active');
  document.getElementById('registerForm').classList.add('active');
}

function login() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  
  if (!username || !password) {
    alert('Заполните все поля');
    return;
  }
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    alert('Неверное имя пользователя или пароль');
    return;
  }
  
  currentUser = user;
  saveData();
  
  if (user.isAdmin && confirm('Войти в админ-панель?')) {
    showScreen('adminScreen');
    loadAdminData();
  } else {
    showScreen('mainScreen');
    loadChats();
  }
}

function register() {
  const name = document.getElementById('regName').value.trim();
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  
  if (!name || !username || !password) {
    alert('Заполните все поля');
    return;
  }
  
  if (username.length < 3) {
    alert('Имя пользователя должно быть минимум 3 символа');
    return;
  }
  
  if (users.find(u => u.username === username)) {
    alert('Это имя пользователя уже занято');
    return;
  }
  
  const newUser = {
    id: Date.now(),
    name,
    username,
    password,
    bio: '',
    avatar: null,
    verified: false,
    premium: false,
    isAdmin: false,
    createdAt: Date.now()
  };
  
  users.push(newUser);
  currentUser = newUser;
  saveData();
  
  showScreen('mainScreen');
  loadChats();
}

// === ЧАТЫ ===

function loadChats() {
  const chatList = document.getElementById('chatList');
  const userChats = chats.filter(c => 
    c.participants.includes(currentUser.id) ||
    (c.type === 'channel' && c.members?.includes(currentUser.id))
  );
  
  if (userChats.length === 0) {
    chatList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text2)">Нет чатов</div>';
    return;
  }
  
  chatList.innerHTML = userChats.map(chat => {
    const otherUserId = chat.participants.find(id => id !== currentUser.id);
    const otherUser = users.find(u => u.id === otherUserId);
    const chatName = chat.type === 'dm' ? otherUser?.name : chat.name;
    const lastMsg = messages[chat.id]?.[messages[chat.id].length - 1];
    
    return `
      <div class="chat-item ${currentChat?.id === chat.id ? 'active' : ''}" onclick="openChat(${chat.id})">
        <div class="avatar ${otherUser?.verified ? 'verified' : ''}">
          ${chatName ? chatName[0].toUpperCase() : '?'}
        </div>
        <div class="info">
          <div class="name">
            ${chatName || 'Чат'}
            ${otherUser?.verified ? '<span style="color:var(--verified)">✓</span>' : ''}
          </div>
          <div class="last-msg">${lastMsg?.text || 'Нет сообщений'}</div>
        </div>
        <div class="time">${lastMsg ? formatTime(lastMsg.timestamp) : ''}</div>
      </div>
    `;
  }).join('');
}

function searchChats() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const items = document.querySelectorAll('.chat-item');
  
  items.forEach(item => {
    const name = item.querySelector('.name').textContent.toLowerCase();
    item.style.display = name.includes(query) ? 'flex' : 'none';
  });
}

function openChat(chatId) {
  currentChat = chats.find(c => c.id === chatId);
  if (!currentChat) return;
  
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('chatView').style.display = 'flex';
  
  const otherUserId = currentChat.participants.find(id => id !== currentUser.id);
  const otherUser = users.find(u => u.id === otherUserId);
  const chatName = currentChat.type === 'dm' ? otherUser?.name : currentChat.name;
  
  document.getElementById('chatName').textContent = chatName || 'Чат';
  document.getElementById('chatAvatar').textContent = chatName ? chatName[0].toUpperCase() : '?';
  
  loadMessages();
  loadChats();
}

function loadMessages() {
  if (!currentChat) return;
  
  const messagesContainer = document.getElementById('messages');
  const chatMessages = messages[currentChat.id] || [];
  
  messagesContainer.innerHTML = chatMessages.map(msg => {
    const isOwn = msg.userId === currentUser.id;
    const sender = users.find(u => u.id === msg.userId);
    
    return `
      <div class="message ${isOwn ? 'out' : 'in'}">
        ${!isOwn && currentChat.type === 'group' ? `<div class="sender">${sender?.name}</div>` : ''}
        ${msg.text}
        <div class="time">${formatTime(msg.timestamp)}</div>
      </div>
    `;
  }).join('');
  
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  
  if (!text || !currentChat) return;
  
  if (!messages[currentChat.id]) {
    messages[currentChat.id] = [];
  }
  
  messages[currentChat.id].push({
    id: Date.now(),
    userId: currentUser.id,
    text,
    timestamp: Date.now()
  });
  
  saveData();
  loadMessages();
  loadChats();
  input.value = '';
}

function showNewChat() {
  const username = prompt('Введите имя пользователя:');
  if (!username) return;
  
  const targetUser = users.find(u => u.username === username);
  if (!targetUser) {
    alert('Пользователь не найден');
    return;
  }
  
  if (targetUser.id === currentUser.id) {
    alert('Нельзя создать чат с самим собой');
    return;
  }
  
  const existingChat = chats.find(c => 
    c.type === 'dm' && 
    c.participants.includes(currentUser.id) && 
    c.participants.includes(targetUser.id)
  );
  
  if (existingChat) {
    openChat(existingChat.id);
    return;
  }
  
  const newChat = {
    id: Date.now(),
    type: 'dm',
    participants: [currentUser.id, targetUser.id],
    createdAt: Date.now()
  };
  
  chats.push(newChat);
  messages[newChat.id] = [];
  saveData();
  
  loadChats();
  openChat(newChat.id);
}

function attachFile() {
  alert('Прикрепление файлов в разработке');
}

function showChatInfo() {
  alert('Информация о чате в разработке');
}

function showSettings() {
  alert('Настройки в разработке');
}

// === АДМИНКА ===

function loadAdminData() {
  loadAdminUsers();
  updateStats();
}

function showAdminTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  document.querySelectorAll('.admin-content').forEach(content => {
    content.classList.remove('active');
  });
  
  document.getElementById('admin' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
}

function loadAdminUsers() {
  const userList = document.getElementById('userList');
  
  userList.innerHTML = users.map(user => `
    <div class="user-card">
      <div class="avatar">${user.name[0].toUpperCase()}</div>
      <div class="info">
        <div class="name">
          ${user.name}
          ${user.verified ? '<span style="color:var(--verified)">✓</span>' : ''}
        </div>
        <div class="username">@${user.username}</div>
        <div class="badges">
          ${user.verified ? '<span class="badge verified">Верифицирован</span>' : ''}
          ${user.premium ? '<span class="badge premium">Premium</span>' : ''}
          ${user.isAdmin ? '<span class="badge admin">Админ</span>' : ''}
        </div>
      </div>
      <div class="actions">
        <button class="btn-small btn-verify" onclick="toggleVerify(${user.id})">
          ${user.verified ? 'Снять верификацию' : 'Верифицировать'}
        </button>
        <button class="btn-small btn-premium" onclick="togglePremium(${user.id})">
          ${user.premium ? 'Снять Premium' : 'Выдать Premium'}
        </button>
        ${!user.isAdmin ? `<button class="btn-small btn-ban" onclick="banUser(${user.id})">Забанить</button>` : ''}
      </div>
    </div>
  `).join('');
}

function searchUsers() {
  const query = document.getElementById('adminSearchInput').value.toLowerCase();
  const cards = document.querySelectorAll('.user-card');
  
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(query) ? 'flex' : 'none';
  });
}

function toggleVerify(userId) {
  const user = users.find(u => u.id === userId);
  if (user) {
    user.verified = !user.verified;
    saveData();
    loadAdminUsers();
    updateStats();
  }
}

function togglePremium(userId) {
  const user = users.find(u => u.id === userId);
  if (user) {
    user.premium = !user.premium;
    saveData();
    loadAdminUsers();
    updateStats();
  }
}

function banUser(userId) {
  if (!confirm('Вы уверены что хотите забанить этого пользователя?')) return;
  
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users.splice(index, 1);
    saveData();
    loadAdminUsers();
    updateStats();
  }
}

function updateStats() {
  document.getElementById('totalUsers').textContent = users.length;
  document.getElementById('activeUsers').textContent = users.filter(u => !u.banned).length;
  document.getElementById('verifiedUsers').textContent = users.filter(u => u.verified).length;
  document.getElementById('premiumUsers').textContent = users.filter(u => u.premium).length;
}

function exitAdmin() {
  showScreen('mainScreen');
  loadChats();
}

// === УТИЛИТЫ ===

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// Запуск при загрузке
window.addEventListener('DOMContentLoaded', init);
