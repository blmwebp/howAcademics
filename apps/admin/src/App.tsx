import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import AdminLayout from './components/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import BooksPage from './pages/BooksPage';
import BookEditorPage from './pages/BookEditorPage';
import ResourcesPage from './pages/ResourcesPage';
import HomepagePage from './pages/HomepagePage';
import BannersPage from './pages/BannersPage';
import MediaPage from './pages/MediaPage';
import SettingsPage from './pages/SettingsPage';
import StaffPage from './pages/StaffPage';
import AuditPage from './pages/AuditPage';
export default function App() {
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/login" element={<LoginPage/>} />
    <Route element={<AdminLayout/>}>
      <Route path="/" element={<DashboardPage/>}/>
      <Route path="/books" element={<BooksPage/>}/>
      <Route path="/books/new" element={<BookEditorPage/>}/>
      <Route path="/books/:id" element={<BookEditorPage/>}/>
      <Route path="/authors" element={<ResourcesPage resource="authors" />}/>
      <Route path="/categories" element={<ResourcesPage resource="categories" />}/>
      <Route path="/synonyms" element={<ResourcesPage resource="synonyms" />}/>
      <Route path="/homepage" element={<HomepagePage/>}/>
      <Route path="/banners" element={<BannersPage/>}/>
      <Route path="/media" element={<MediaPage/>}/>
      <Route path="/settings" element={<SettingsPage/>}/>
      <Route path="/staff" element={<StaffPage/>}/>
      <Route path="/audit" element={<AuditPage/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></BrowserRouter></AuthProvider>;
}
