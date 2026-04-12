import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PublicTenders from './pages/PublicTenders.jsx';
import PublicMarketplace from './pages/PublicMarketplace.jsx';
import DashboardLayout from './pages/Dashboard.jsx';
import TenderingDashboard from './pages/tendering/TenderingDashboard.jsx';
import NewTender from './pages/tendering/NewTender.jsx';
import DiscoverTenders from './pages/tendering/DiscoverTenders.jsx';
import MyTenders from './pages/tendering/MyTenders.jsx';
import MyBids from './pages/tendering/MyBids.jsx';
import TenderDetails from './pages/tendering/TenderDetails.jsx';
import AddProduct from './pages/tendering/AddProduct.jsx';
import MaterialCatalog from './pages/materials/MaterialCatalog.jsx';
import MyEnquiries from './pages/materials/MyEnquiries.jsx';
import SupplierEnquiries from './pages/materials/SupplierEnquiries.jsx';
import OrgProfile from './pages/admin/OrgProfile.jsx';
import UsersRoles from './pages/admin/UsersRoles.jsx';
import AuditLogs from './pages/admin/AuditLogs.jsx';
import AdminMaterials from './pages/admin/AdminMaterials.jsx';
import AdminUserProfile from './pages/admin/AdminUserProfile.jsx';
import AdminTenderBids from './pages/admin/AdminTenderBids.jsx';
import BidDetail from './pages/tendering/BidDetail.jsx';
import DirectMessages from './pages/messages/DirectMessages.jsx';
import SelfProfile from './pages/profile/SelfProfile.jsx';
import ProductDetail from './pages/materials/ProductDetail.jsx';

function App() {
  const [user, setUser] = React.useState(() => {
    const stored = localStorage.getItem('up-user');
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (data) => {
    if (data?.token) {
      localStorage.setItem('up-token', data.token);
    }
    if (data?.user) {
      localStorage.setItem('up-user', JSON.stringify(data.user));
      setUser(data.user);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('up-token');
    localStorage.removeItem('up-user');
    setUser(null);
  };

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/register" element={<Register onLogin={handleLogin} />} />
      <Route path="/tenders" element={<PublicTenders />} />
      <Route path="/tenders/:tenderId" element={<TenderDetails />} />
      <Route path="/marketplace" element={<PublicMarketplace />} />
      <Route path="/marketplace/product/:materialId" element={<ProductDetail />} />

      <Route
        path="/dashboard/*"
        element={
          user ? (
            <DashboardLayout user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route index element={<Navigate to="tendering" replace />} />

        <Route path="tendering" element={<TenderingDashboard />} />
        <Route path="tendering/new" element={<NewTender />} />
        <Route path="tendering/tender/:tenderId" element={<TenderDetails />} />
        <Route path="tendering/discover" element={<DiscoverTenders />} />
        <Route path="tendering/my-tenders" element={<MyTenders />} />
        <Route path="tendering/my-bids" element={<MyBids />} />
        <Route path="tendering/bid/:bidId" element={<BidDetail />} />

        <Route path="messages" element={<DirectMessages />} />
        <Route path="profile" element={<SelfProfile />} />

        <Route path="materials/catalog" element={<MaterialCatalog />} />
        <Route path="materials/product/:materialId" element={<ProductDetail />} />
        <Route path="materials/add" element={<AddProduct />} />
        <Route path="materials/enquiries" element={<MyEnquiries />} />
        <Route path="materials/incoming" element={<SupplierEnquiries />} />

        <Route path="admin/org-profile" element={<OrgProfile />} />
        <Route path="admin/users-roles" element={<UsersRoles />} />
        <Route path="admin/user/:userId" element={<AdminUserProfile />} />
        <Route path="admin/tender/:tenderId/bids" element={<AdminTenderBids />} />
        <Route path="admin/materials" element={<AdminMaterials />} />
        <Route path="admin/audit-logs" element={<AuditLogs />} />

        <Route path="*" element={<Navigate to="tendering" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
