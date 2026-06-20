import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import AddCompany from './pages/AddCompany';
import AddActivity from './pages/AddActivity';
import ViewActivities from './pages/ViewActivities';
import ActivityDetail from './pages/ActivityDetail';
import ViewCustomers from './pages/ViewCustomers';
import AddEmployee from './pages/AddEmployee';
import ViewEmployees from './pages/ViewEmployees';
import ViewOrders from './pages/ViewOrders';
import AddOrder from './pages/AddOrder';
import RequestQuotation from './pages/RequestQuotation';
import ViewQuotations from './pages/ViewQuotations';
import QuotationDetail from './pages/QuotationDetail';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/signup" replace />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/clients" element={<Layout><Clients /></Layout>} />
          <Route path="/add-company" element={<Layout><AddCompany /></Layout>} />
          <Route path="/add-activity" element={<Layout><AddActivity /></Layout>} />
          <Route path="/activities" element={<Layout><ViewActivities /></Layout>} />
          <Route path="/activity/company/:companyId" element={<Layout><ActivityDetail /></Layout>} />
          <Route path="/customers" element={<Layout><ViewCustomers /></Layout>} />
          <Route path="/add-employee" element={<Layout><AddEmployee /></Layout>} />
          <Route path="/employees" element={<Layout><ViewEmployees /></Layout>} />
          <Route path="/orders" element={<Layout><ViewOrders /></Layout>} />
          <Route path="/add-order" element={<Layout><AddOrder /></Layout>} />
          <Route path="/quotations" element={<Layout><ViewQuotations /></Layout>} />
          <Route path="/request-quotation" element={<Layout><RequestQuotation /></Layout>} />
          <Route path="/quotation/:id" element={<Layout><QuotationDetail /></Layout>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;