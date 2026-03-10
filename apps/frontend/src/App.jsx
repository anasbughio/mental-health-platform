import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Chat from "./components/Chat";
import Register from "./components/Register";
import Journal from "./components/Journal";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/register" element={<Register />} />
        <Route path="/journal" element={<Journal />} />
      </Routes>
    </Router>
  );
}

export default App;