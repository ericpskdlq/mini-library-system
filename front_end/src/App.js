import React, { useState, useEffect, createContext, useContext } from 'react';

const background = 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&q=80';

const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetch('http://localhost:5000/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) setUser(data.user);
          else logout();
        })
        .catch(() => logout());
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    }
    return { success: false, message: data.message };
  };

  const register = async (name, email, password, role = 'user') => {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    }
    return { success: false, message: data.message };
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const LoginPage = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (!result.success) setError(result.message || 'Login failed');
  };

  return (
    <div className="background" style={{ backgroundImage: `url(${background})` }}>
      <div className="container auth-container">
        <h1>Mini Library System</h1>
      
        {error && <p className="error-message">{error}</p>}
        <div className="auth-form">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleSubmit} className="btn-primary">Login</button>
        </div>
        <p className="switch-link">Don’t have an account? <span onClick={onSwitchToRegister} className="link">Register here</span></p>
      </div>
    </div>
  );
};

const RegisterPage = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleSubmit = async () => {
    setError('');
    if (!name || !email || !password) return setError('All fields are required');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    const result = await register(name, email, password, role);
    if (!result.success) setError(result.message || 'Registration failed');
  };

  return (
    <div className="background" style={{ backgroundImage: `url(${background})` }}>
      <div className="container auth-container">
        <h1>Mini Library System</h1>
        <h2>Register</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="auth-form">
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleSubmit} className="btn-primary">Register</button>
        </div>
        <p className="switch-link">Already have an account? <span onClick={onSwitchToLogin} className="link">Login here</span></p>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [books, setBooks] = useState([]);
  const [formData, setFormData] = useState({ title: '', author: '', description: '' });
  const { token, logout, user } = useAuth();

  const fetchBooks = () => {
    fetch('http://localhost:5000/api/books')
      .then(res => res.json())
      .then(data => setBooks(data))
      .catch(err => console.error('Error fetching books:', err));
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData),
    })
      .then(res => res.json())
      .then(() => {
        setFormData({ title: '', author: '', description: '' });
        fetchBooks();
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      fetch(`http://localhost:5000/api/books/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(() => fetchBooks());
    }
  };

  return (
    <div className="background" style={{ backgroundImage: `url(${background})` }}>
      <div className="container admin-container">
        <div className="header">
          <h1>Admin Dashboard - Welcome {user?.name}!</h1>
        </div>

        <h2 className="non-cursive">Add New Book</h2>
        <div className="form-section">
          <input type="text" name="title" placeholder="Book Title" value={formData.title} onChange={handleChange} />
          <input type="text" name="author" placeholder="Author" value={formData.author} onChange={handleChange} />
          <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
          <button onClick={handleSubmit} className="btn-primary">Add Book</button>
        </div>

        <h2>All Books ({books.length})</h2>
        {books.length === 0 ? <p>No books found.</p> : (
          <ul className="book-list">
            {books.map((book) => (
              <li key={book._id} className="book-item">
                <div className="book-info">
                  <div>
                    <strong>{book.title}</strong> — {book.author || "Unknown"} <br /><em>{book.description}</em>
                  </div>
                  <button onClick={() => handleDelete(book._id)} className="btn-delete">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <button onClick={logout} className="btn-logout">Logout</button>
      </div>
    </div>
  );
};

const UserDashboard = () => {
  const [books, setBooks] = useState([]);
  const { logout, user } = useAuth();

  useEffect(() => {
    fetch('http://localhost:5000/api/books')
      .then(res => res.json())
      .then(data => setBooks(data));
  }, []);

  return (
    <div className="background" style={{ backgroundImage: `url(${background})` }}>
      <div className="container">
        <div className="header">
          <h1>Library - Welcome {user?.name}!</h1>
        </div>
        <h2>Available Books ({books.length})</h2>
        {books.length === 0 ? <p>No books found.</p> : (
          <ul className="book-list">
            {books.map((book) => (
              <li key={book._id} className="book-item">
                <div><strong>{book.title}</strong> — {book.author || "Unknown"} <br /><em>{book.description}</em></div>
              </li>
            ))}
          </ul>
        )}
        <button onClick={logout} className="btn-logout">Logout</button>
      </div>
    </div>
  );
};

const App = () => {
  const [showLogin, setShowLogin] = useState(true);
  const { user } = useAuth();

  if (!user) {
    return showLogin ? (
      <LoginPage onSwitchToRegister={() => setShowLogin(false)} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setShowLogin(true)} />
    );
  }

  return user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />;
};

export default function Root() {
  return (
    <AuthProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cardo:wght@400;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Cardo', serif; background: #D2B48C; }

        .background {
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          min-height: 100vh;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .container {
          background: #e3caa5;
          padding: 45px 60px;
          border-radius: 20px;
          box-shadow: 0 8px 30px rgba(80, 50, 20, 0.4);
          border: 3px solid #b28f63;
          max-width: 650px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        h1 {
          text-align: center;
          color: #5a3e1b;
          font-family: 'Great Vibes', cursive;
          font-size: 48px;
        }

        h2 {
          text-align: center;
          color: #5a3e1b;
          font-family: 'Great Vibes', cursive;
          font-size: 36px;
        }

        .non-cursive {
          font-family: 'Cardo', serif;
          font-weight: 700;
          font-size: 28px;
          color: #4b2e05;
          text-align: center;
        }

        input, textarea, select {
          background: #f8ecd1;
          border: 2px solid #c2a172;
          padding: 12px 15px;
          border-radius: 10px;
          width: 100%;
          font-family: 'Cardo', serif;
          color: #4b2e05;
        }

        input::placeholder, textarea::placeholder {
          color: #a07a47;
        }

        .auth-form, .form-section {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .btn-primary {
          background: #8b5e3b;
          color: #fffaf0;
          border: none;
          border-radius: 10px;
          padding: 12px 20px;
          cursor: pointer;
          font-weight: bold;
          transition: 0.3s;
        }

        .btn-primary:hover {
          background: #704a2a;
        }

        .btn-logout, .btn-delete {
          background: #8b4513;
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
        }

        .btn-logout:hover, .btn-delete:hover {
          background: #6d3610;
        }

        .book-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .book-item {
          background: #f5deb3;
          border: 1px solid #c2a172;
          padding: 15px;
          border-radius: 10px;
        }

        .book-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .switch-link { text-align: center; margin-top: 20px; color: #5a3e1b; }
        .link { color: #8b4513; cursor: pointer; text-decoration: underline; }

        .error-message {
          background: #f8e4d0;
          color: #7a3e05;
          padding: 10px;
          border-radius: 10px;
          text-align: center;
        }

        .btn-logout {
          align-self: center;
          margin-top: auto;
          width: fit-content;
        }
      `}</style>
      <App />
    </AuthProvider>
  );
}
