import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const { userId } = useParams();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Prevent accessing another user's dashboard
  if (userId && currentUser.uid !== userId) {
    return <Navigate to={`/dashboard/${currentUser.uid}/overview`} replace />;
  }

  return children;
}
