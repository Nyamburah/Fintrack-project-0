import { Navigate } from 'react-router-dom';
//import { useAuth } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';

/**
 * Protected Route Component
 * 
 * This component ensures that only authenticated users can access
 * certain pages. If a user is not authenticated, they are redirected
 * to the login page.
 * 
 * @param {object} props - Props containing child components
 * @returns The children if authenticated, or a redirect to login
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
