"use client";

import { useAuth } from "@/contexts/AuthContext";
import { authAPI } from "@/lib/api";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "react-toastify";
import styles from "./page.module.css";

function LoginContent() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const router =useRouter();

  const { login } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);

    // Check for error messages from OAuth or other sources
    const error = searchParams.get("error");
    const message = searchParams.get("message");
    const email = searchParams.get("email");

    if (error) {
      switch (error) {
        case "user_not_registered":
          setError(
            `This email (${
              email || "your email"
            }) is not registered. Please register with Google OAuth.`
          );
          // Auto-redirect to register page after 3 seconds
          setTimeout(() => {
            window.location.href = `/register${
              email ? `?email=${encodeURIComponent(email)}` : ""
            }`;
          }, 3000);
          break;
        case "database_error":
          setError("Database connection error. Please try again later.");
          break;
        case "OAuthCallback":
          setError(
            "Google sign-in encountered a network issue. Please try again."
          );
          break;
        case "OAuthAccountNotLinked":
          setError(
            "This email is already associated with another account. Please use a different sign-in method."
          );
          break;
        case "OAuthCreateAccount":
          setError("Unable to create account. Please try again.");
          break;
        case "OAuthSignin":
          setError("Google sign-in failed. Please try again.");
          break;
        case "AccessDenied":
          setError(
            "Access denied: Please use your Parul University email address (@paruluniversity.ac.in)"
          );
          break;
        case "StudentAccountNotFound":
          setError(
            message || "Student account not found. Please contact the administrator if you should have access."
          );
          break;
        default:
          setError("Authentication failed. Please try again.");
      }
    } else if (message === "setup-complete") {
      toast.success(
        "Registration completed successfully! You can now sign in with your credentials."
      );
    } else if (message === "registration-complete") {
      toast.success("Account created successfully! You can now sign in.");
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError("");

      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        console.error("Google sign-in error:", result.error);
        switch (result.error) {
          case "OAuthCallback":
            setError(
              "Network timeout during Google sign-in. Please check your internet connection and try again."
            );
            break;
          case "OAuthAccountNotLinked":
            setError(
              "This Google account is already linked to another user. Please use a different account."
            );
            break;
          default:
            setError(
              `Google sign-in failed: ${result.error}. Please try again.`
            );
        }
      } else if (result?.ok) {
        toast.success("Signed in successfully!");
        // Give time for session to be established
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else if (result?.url) {
        // Handle redirect
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Google sign-in exception:", error);
      setError(
        "Google sign-in failed due to a network issue. Please try again."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.login(formData);
      if (response.accessToken) {
        const tokenPayload = JSON.parse(
          atob(response.accessToken.split(".")[1])
        );
        login(response.accessToken, tokenPayload.user.username);
      }
    } catch (error) {
      console.error("Login error:", error);
      if (
        error.message.includes(
          "Only @paruluniversity.ac.in email addresses are allowed"
        )
      ) {
        setError(
          "Access denied: Please use your Parul University email address (@paruluniversity.ac.in)"
        );
      } else if (error.message.includes("Invalid email or password")) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(error.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Animated background elements */}
      <div className={styles.backgroundOverlay}>
        <div className={styles.backgroundElements}>
          <div className={styles.blob1}></div>
          <div className={styles.blob2}></div>
          <div className={styles.blob3}></div>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <div
          className={`${styles.formContainer} ${
            mounted ? styles.formContainerVisible : ""
          }`}
        >
          {/* Logo/Title */}
          <div className={styles.header}>
            <h1 className={styles.title}>
              Student Hub
            </h1>
            <p className={styles.subtitle}>
              Welcome back! Please sign in with your Parul University account.
            </p>
            <div className={styles.infoBox}>
              <p className={styles.infoText}>
                🏫 Only @paruluniversity.ac.in email addresses are allowed
              </p>
            </div>
            <div className={styles.infoBoxGreen}>
              <p className={styles.infoTextGreen}>
                📚 Students: Use your student email (13-digit number) to login. Student accounts are pre-configured and cannot register here.
              </p>
            </div>
          </div>

          {/* Login Form */}
          <div className={styles.formCard}>
            <div className={styles.formCardGlow}></div>
            <div className={styles.formCardInner}>
              <form
                onSubmit={handleSubmit}
                className={styles.form}
              >
                {error && (
                  <div className={styles.errorBox}>
                    <p className={styles.errorText}>{error}</p>
                  </div>
                )}

                <div className={styles.formField}>
                  <label
                    htmlFor="email"
                    className={styles.label}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Enter your @paruluniversity.ac.in email"
                    style={{ fontSize: "16px" }}
                  />
                </div>

                <div className={styles.formField}>
                  <label
                    htmlFor="password"
                    className={styles.label}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Enter your password"
                    style={{ fontSize: "16px" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submitButton}
                >
                  {loading ? (
                    <div className={styles.loadingContainer}>
                      <div className={styles.spinner}></div>
                      <span className={styles.loadingText}>
                        Signing in...
                      </span>
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </button>

                {/* Divider */}
                <div className={styles.divider}>
                  <div className={styles.dividerLine}>
                    <div className={styles.dividerBorder}></div>
                  </div>
                  <div className={styles.dividerText}>
                    <span className={styles.dividerTextInner}>
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className={styles.googleButton}
                >
                  {googleLoading ? (
                    <div className={styles.loadingContainer}>
                      <div className={styles.spinner}></div>
                      <span className={styles.loadingText}>
                        Signing in with Google...
                      </span>
                    </div>
                  ) : (
                    <>
                      <svg className={styles.googleIcon} viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Sign in with Google
                    </>
                  )}
                </button>

                <div className={styles.footerSection}>
                  <p className={styles.footerText}>
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/register"
                      className={styles.footerLink}
                    >
                      Sign up here
                    </Link>
                  </p>
                </div>

                {/* Back to Dashboard */}
                <div className={styles.backButton}>
                  <button
                    onClick={() => router.push("/")}
                    className={styles.backButtonLink}
                  >
                    <span>←</span>
                    <span>Back to Dashboard</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className={styles.loadingFallback}>
          <div className={styles.loadingFallbackText}>Loading...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
