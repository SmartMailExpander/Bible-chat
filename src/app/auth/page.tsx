import AuthForm from "./AuthForm";
import styles from "./AuthForm.module.css";

export default function AuthPage() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f7f4ef 0%, #efe9e1 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 0 }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 22, color: '#6b5c4a', fontWeight: 700, marginBottom: 8 }}>
          Welcome to Haven
        </div>
        <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 16, color: '#b0a597', fontStyle: 'italic' }}>
          “With God all things are possible.” <br />
          <span style={{ fontSize: 14 }}>Matthew 19:26</span>
        </div>
      </div>
      <AuthForm />
    </div>
  );
} 