import { Link } from "react-router-dom";

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [error, setError] = useState("");
     const navigate = useNavigate();  
     
     const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");     
    try {
    const res = await api.post("/auth/register", {
      name: name,
      email: email,
      password: password,
      role: role
    }); 
    console.log(res.data);

    // redirect after registration
    navigate("/login");
  } catch (error) {
    setError(error.response?.data?.message || "Registration failed");
  }     
};


    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Name:</label>
                    <input    
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required    
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Email:</label>   
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>  
                <div style={{ marginBottom: '15px' }}>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />

                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Role:</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '8px' }}>
                        <option value="patient">Patient</option>
                        <option value="admin">Admin</option>
                            <option value="provider">Provider</option>
                    </select>
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit" style={{ padding: '10px 20px' }}>
                    Register
                </button>   
            </form>
          <Link to="/login" style={{ display: 'block', marginTop: '15px', textDecoration: 'none', color: '#007BFF' }}>
            Already have an account? Log in here.
          </Link>
        </div>
    );
}   

export default Register;