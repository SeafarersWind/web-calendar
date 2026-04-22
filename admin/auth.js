/**
 * Shared authentication logic for the admin dashboard
 */

const auth = {
    setToken(token) {
        localStorage.setItem('admin_token', token);
    },

    getToken() {
        return localStorage.getItem('admin_token');
    },

    logout() {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
    },

    async verifyToken() {
        const token = this.getToken();
        if (!token) return false;

        try {
            const response = await fetch('/isadmin', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Token verification failed:', error);
            return false;
        }
    },

    getHeaders() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
};

// Auto-check authentication if on an admin page (except login/signup)
if (window.location.pathname.startsWith('/admin') && 
    !window.location.pathname.endsWith('login') && 
    !window.location.pathname.endsWith('login.html') &&
    !window.location.pathname.endsWith('signup') && 
    !window.location.pathname.endsWith('signup.html')) {
    
    if (!auth.getToken()) {
        window.location.href = '/admin/login';
    }
}
