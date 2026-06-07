// ==========================================
// FILE 3: AUTH.JS (OTENTIKASI & SESI)
// ==========================================

function checkSession() {
    const savedUser = localStorage.getItem('portal_user_session');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('login-overlay').classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            document.getElementById('login-overlay').classList.add('hidden');
            document.getElementById('main-content').classList.remove('hidden');
            document.getElementById('mobile-nav').classList.remove('hidden');
            setTimeout(() => document.getElementById('main-content').classList.remove('opacity-0'), 50);
        }, 500);
        applyRBAC(); 
        loadAppData(true); 
    }
}

function processLoginResponse(result) {
    const btnSubmit = document.getElementById('btn-login-submit');
    const errorMsg = document.getElementById('login-error-msg');

    if (result.status === 'success') {
        currentUser = result.data;
        localStorage.setItem('portal_user_session', JSON.stringify(currentUser));
        
        document.getElementById('login-overlay').classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            document.getElementById('login-overlay').classList.add('hidden');
            document.getElementById('main-content').classList.remove('hidden');
            document.getElementById('mobile-nav').classList.remove('hidden');
            setTimeout(() => document.getElementById('main-content').classList.remove('opacity-0'), 50);
        }, 500);

        applyRBAC();
        loadAppData(true);
    } else {
        errorMsg.textContent = result.message || "Terjadi kesalahan sistem.";
        errorMsg.classList.remove('hidden');
        btnSubmit.innerHTML = '<span>Masuk ke Sistem</span>';
        btnSubmit.disabled = false;
    }
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    const btnSubmit = document.getElementById('btn-login-submit');
    const errorMsg = document.getElementById('login-error-msg');
    
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Memverifikasi...';
    errorMsg.classList.add('hidden');

    const usernameInput = document.getElementById('login-username').value;
    const passwordInput = document.getElementById('login-password').value;

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'login', payload: { username: usernameInput, password: passwordInput } })
        });
        const result = await response.json();
        processLoginResponse(result);
    } catch (error) {
        errorMsg.textContent = "Gagal menghubungi server. Periksa koneksi internet Anda.";
        errorMsg.classList.remove('hidden');
        btnSubmit.innerHTML = '<span>Masuk ke Sistem</span>';
        btnSubmit.disabled = false;
    }
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) { return null; }
}

async function handleGoogleLogin(response) {
    const errorMsg = document.getElementById('login-error-msg');
    errorMsg.classList.add('hidden');

    const decodedToken = parseJwt(response.credential);
    if (!decodedToken || !decodedToken.email) {
        errorMsg.textContent = "Gagal membaca kredensial Google.";
        errorMsg.classList.remove('hidden');
        return;
    }

    try {
        document.getElementById('btn-login-submit').innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> SSO Login...';
        const fetchRes = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'loginGoogle', payload: { email: decodedToken.email } })
        });
        const result = await fetchRes.json();
        processLoginResponse(result);
    } catch (error) {
        errorMsg.textContent = "SSO Gagal menghubungi server.";
        errorMsg.classList.remove('hidden');
        document.getElementById('btn-login-submit').innerHTML = '<span>Masuk ke Sistem</span>';
    }
}

function handleLogout() {
    if (confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
        localStorage.removeItem('portal_user_session');
        currentUser = null;
        window.location.reload(); 
    }
}