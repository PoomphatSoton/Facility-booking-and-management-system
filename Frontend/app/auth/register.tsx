import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import "./auth.css";
import { authService } from "~/services/auth.service";
import { APP_BRAND_NAME, APP_BRAND_SUBTITLE, APP_BRAND_TAGLINE } from "~/constants/app.constants";
import type { ApiError, RegistrationStep } from "~/services/types";

type UiStep = 1 | 2 | 3;

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<UiStep>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpRegistrationId, setOTPRegistrationId] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const toUiStep = (backendStep?: RegistrationStep): UiStep | undefined => {
    if (backendStep === "otp") return 2;
    if (backendStep === "details") return 3;
    if (backendStep === "credentials") return 1;
    return undefined;
  };

  const syncStepFromBackend = (nextStep?: RegistrationStep) => {
    const uiStep = toUiStep(nextStep);
    if (uiStep) {
      setStep(uiStep);
    }
  };

  const hydrateFromQuery = async () => {
    const session = await authService.checkLogin();
    if (session.isPendingStep3) {
      setStep(3);
      return;
    }

    if (session.isLoggedIn) {
      navigate("/");
    }
  };

  const handleApiError = (error: unknown) => {
    const apiError = (error as ApiError) ?? { message: "Something went wrong" };
    setErrorMessage(apiError.message || "Something went wrong");
  };

  const prepareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");
  };

  useEffect(() => {
    void hydrateFromQuery();
  }, []);

  const handleStep1Submit = async (e: React.FormEvent) => {
    prepareSubmit(e);

    setIsSubmitting(true);
    try {
      const result = await authService.registerCredentials({ email, password });
      setOTPRegistrationId(result.registrationId);
      if (result.message) {
        setInfoMessage(result.message);
      }
      syncStepFromBackend(result.nextStep);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    prepareSubmit(e);

    setIsSubmitting(true);
    try {
      const result = await authService.verifyOtp({ registrationId: otpRegistrationId, otp });
      await authService.login({ email, password });
      console.log("OTP verification res = ", result);
      if (result.message) {
        setInfoMessage(result.message);
      }
      syncStepFromBackend(result.nextStep);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMessage("");
    setInfoMessage("");
    setIsSubmitting(true);
    try {
      const result = await authService.resendOtp({ registrationId: otpRegistrationId });
      setOtp("");
      if (result.message) {
        setInfoMessage(result.message);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    prepareSubmit(e);

    setIsSubmitting(true);
    try {
      await authService.completeRegister({
        firstName,
        lastName,
        dateOfBirth,
        address,
      });

      alert("Profile completed successfully");
      navigate("/");
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-panel">
        <div className="auth-side">
          <div>
            <h1>{APP_BRAND_NAME}</h1>
            <p>{APP_BRAND_SUBTITLE}</p>
          </div>
          <p>{APP_BRAND_TAGLINE}</p>
        </div>

        <div className="auth-form-wrap">
          <h2>Create Account</h2>
          <p>Sign up for your sports centre account</p>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          {infoMessage && <Alert variant="info">{infoMessage}</Alert>}

          {step === 1 && (
            <Form onSubmit={handleStep1Submit} className="auth-form">
              <Form.Group className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                />
              </Form.Group>

              <Button
                variant="primary"
                size="lg"
                type="submit"
                className="w-100 mb-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Spinner animation="border" size="sm" /> : "Next"}
              </Button>
            </Form>
          )}

          {step === 2 && (
            <Form onSubmit={handleStep2Submit} className="auth-form">
              <p className="text-muted mb-3">OTP has been sent to {email}</p>
              <Form.Group className="mb-3">
                <Form.Label>Enter OTP Code</Form.Label>
                <Form.Control
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  required
                />
              </Form.Group>

              <Button
                variant="primary"
                size="lg"
                type="submit"
                className="w-100 mb-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Spinner animation="border" size="sm" /> : "Verify OTP"}
              </Button>

              <Button
                variant="outline-secondary"
                size="sm"
                type="button"
                className="w-100"
                onClick={handleResendOtp}
                disabled={isSubmitting}
              >
                Resend OTP
              </Button>
            </Form>
          )}

          {step === 3 && (
            <Form onSubmit={handleStep3Submit} className="auth-form">
              <Form.Group className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Date of Birth</Form.Label>
                <Form.Control
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your address"
                  required
                />
              </Form.Group>

              <Button
                variant="primary"
                size="lg"
                type="submit"
                className="w-100 mb-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Spinner animation="border" size="sm" /> : "Complete Registration"}
              </Button>
            </Form>
          )}

          <p className="auth-footer">
            Already have an account? <Link to="/auth/login" className="text-primary">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}