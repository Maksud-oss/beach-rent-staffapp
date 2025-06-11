// StaffApp/src/components/LoginForm.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginForm({ onLogin }) {
  const [login, setLogin] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!login.trim()) {
      alert("Введите ваш логин");
      return;
    }
    onLogin(login.trim());
    navigate("/dashboard");
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100vw",
        height: "100vh",
        margin: 0,
        background: "#f8f0f8",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "linear-gradient(135deg, #ffe4f0, #ffd0e8)",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          minWidth: 300,
        }}
      >
        <h2 style={{ marginBottom: 20, color: "#333" }}>Вход для сотрудника</h2>
        <label
          style={{
            marginBottom: 16,
            fontSize: 16,
            color: "#555",
            width: "100%",
          }}
        >
          Логин:
          <br />
          <input
            autoFocus
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="login"
            style={{
              marginTop: 6,
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ccc",
              width: "100%",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </label>
        <button
          type="submit"
          style={{
            marginTop: 8,
            padding: "12px 30px",
            background: "linear-gradient(to right, #DB7093, #C71585)",
            color: "#fff",
            border: "none",
            borderRadius: 30,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 16,
            boxShadow: "0 3px 8px rgba(0, 0, 0, 0.2)",
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Войти
        </button>
      </form>
    </div>
  );
}
