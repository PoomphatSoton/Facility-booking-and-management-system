import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import "./auth.css";
import { authService } from "~/services/auth.service";
import { APP_BRAND_NAME, APP_BRAND_SUBTITLE, APP_BRAND_TAGLINE } from "~/constants/app.constants";
import type { ApiError } from "~/services/types";


export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [infoMessage, setInfoMessage] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setInfoMessage("");

        setIsSubmitting(true);
        try {
            const result = await authService.login({ email, password });

            if ("nextStep" in result && result.nextStep === "details") {
                navigate("/auth/register");
                return;
            }

            setInfoMessage("Login successful");
            navigate("/");
        } catch (error) {
            const apiError = error as ApiError;
            setErrorMessage(apiError.message || "Login failed");
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
                    <div className="auth-form">
                        <h2>Welcome Back</h2>
                        <p>Sign in to access your sports centre account</p>
                        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                        {infoMessage && <Alert variant="info">{infoMessage}</Alert>}

                        <Form onSubmit={handleSubmit}>
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

                            <div className="mb-3 text-end">
                                <Link to="/auth/forgot-password" className="text-decoration-none">Forgot password?</Link>
                            </div>

                            <Button
                                variant="primary"
                                size="lg"
                                type="submit"
                                className="w-100 mb-3"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Spinner animation="border" size="sm" /> : "Log In"}
                            </Button>
                        </Form>

                        <p className="auth-footer">
                            Don&apos;t have an account? <Link to="/auth/register" className="text-primary">Sign up</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}