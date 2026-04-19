import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import AppShell from '@/components/AppShell'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Artifacts from '@/pages/Artifacts'
import ArtifactDetail from '@/pages/ArtifactDetail'
import Play from '@/pages/Play'
import Compose from '@/pages/Compose'
import Community from '@/pages/Community'
import MessagesHome from '@/pages/MessagesHome'
import ChatPage from '@/pages/Chat'
import AssistantPage from '@/pages/Assistant'
import Profile from '@/pages/Profile'
import LibraryPage from '@/pages/Library'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/artifacts" element={<Artifacts />} />
          <Route path="/artifacts/:id" element={<ArtifactDetail />} />
          <Route path="/play" element={<Play />} />
          <Route path="/compose" element={<Compose />} />
          <Route path="/community" element={<Community />} />
          <Route path="/messages" element={<MessagesHome />} />
          <Route path="/messages/:friendId" element={<ChatPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  )
}
