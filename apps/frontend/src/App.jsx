import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Chat from "./components/Chat";
import Register from "./components/Register";
import Journal from "./components/Journal";
import Goals from "./components/Goals";
import CrisisResources from "./components/Crisisresorces";
import SentimentInsights from "./components/Sentimentinsights";
import WeeklyReport from "./components/WeeklyReport";
import GuidedExercises from "./components/GuidedExercises";
import Notifications from "./components/Notifications";
import SleepTracker from "./components/SleepTracker";
import Analytics from "./components/Analytics";
import Navbar from "./components/Navbar";
import Landing from "./components/Landing";


function App() {
  return (
    <Router>
        <Navbar /> 
          <div style={{ width: '100%', minHeight: '100vh' }}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/register" element={<Register />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/crisis" element={<CrisisResources />} />
        <Route path="/sentiment" element={<SentimentInsights />} />
        <Route path="/weekly-report" element={<WeeklyReport />} />
        <Route path="/exercises" element={<GuidedExercises />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/sleep" element={<SleepTracker />} />
        <Route path="/analytics" element={<Analytics />} />
        
      </Routes>
      </div>
    </Router>
  );
}

export default App;