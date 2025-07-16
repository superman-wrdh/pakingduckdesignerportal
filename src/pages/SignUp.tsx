import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SignUpForm } from "@/components/auth/SignUpForm";

const SignUp = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Don't render if user is already authenticated
  if (user) {
    return null;
  }

  return <SignUpForm />;
};

export default SignUp;