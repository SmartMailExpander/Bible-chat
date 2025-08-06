"use client";
import { useState } from "react";
import { auth } from "../../firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import styles from "./AuthForm.module.css";
import { useRouter } from "next/navigation";

export default function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const isSignup = mode === "signup";

  function validate() {
    if (!email || !password || (isSignup && !confirm)) return "All fields are required.";
    if (isSignup && password !== confirm) return "Passwords do not match.";
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const err = validate();
    if (err) return setError(err);
    setLoading(true);
    try {
      if (isSignup) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCred.user, { displayName: name });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setLoading(false);
      if (onSuccess) onSuccess();
      router.push("/");
    } catch (e: any) {
      console.error(e);
      setError(e.message || JSON.stringify(e) || "Unknown error");
      setLoading(false);
    }
  }

  return (
    <div className={styles.authContainer}>
      {/* Header Section */}
      <div className={styles.authHeader}>
        <div className={styles.authLogo}>
          <div className={styles.logoIcon}>✝</div>
          <div className={styles.authTitle}>Haven</div>
        </div>
        <div className={styles.authSubtitle}>
          Your spiritual journey begins here
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.authTabs}>
        <button 
          className={`${styles.authTab} ${mode === "login" ? styles.authTabActive : ""}`} 
          onClick={() => setMode("login")}
        >
          Sign In
        </button>
        <button 
          className={`${styles.authTab} ${mode === "signup" ? styles.authTabActive : ""}`} 
          onClick={() => setMode("signup")}
        >
          Create Account
        </button>
      </div>

      {/* Welcome Message */}
      <div className={styles.authGreeting}>
        {mode === "login" ? "Welcome back to your spiritual haven" : "Begin your journey with us"}
      </div>

      {/* Error Display */}
      {error && <div className={styles.authError}>{error}</div>}

      {/* Form */}
      <form onSubmit={handleSubmit} className={styles.authForm}>
        {isSignup && (
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Full Name</label>
            <input
              className={styles.authInput}
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
        )}
        
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Email Address</label>
          <input
            className={styles.authInput}
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Password</label>
          <input
            className={styles.authInput}
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        </div>

        {isSignup && (
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Confirm Password</label>
            <input
              className={styles.authInput}
              type="password"
              placeholder="Confirm your password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        )}

        <button className={styles.authButton} type="submit" disabled={loading}>
          {loading ? (
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner}></div>
              {mode === "login" ? "Signing in..." : "Creating account..."}
            </div>
          ) : (
            mode === "login" ? "Sign In" : "Create Account"
          )}
        </button>
      </form>

      {/* Footer */}
      <div className={styles.authFooter}>
        <div className={styles.authSwitch} onClick={() => setMode(isSignup ? "login" : "signup")}>
          {isSignup ? "Already have an account? Sign in" : "Don't have an account? Create one"}
        </div>
      </div>
    </div>
  );
} 