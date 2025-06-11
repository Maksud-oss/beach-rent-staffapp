// StaffApp/src/components/Scanner.jsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import "./Scanner.css";

export default function Scanner({ operatorName, onLogout }) {
  const navigate = useNavigate();
  const [lastResult, setLastResult] = useState("Нет данных");
  const qrRegionRef = useRef(null);

  useEffect(() => {
    const qrRegionId = "html5qr-code-region";
    const html5Qr = new Html5Qrcode(qrRegionId);

    html5Qr
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: 250,
        },
        (decodedText, decodedResult) => {
          setLastResult(decodedText);
        },
        (errorMessage) => {
          // можно показывать ошибки скана в консоль
          // console.warn("QR Error:", errorMessage);
        }
      )
      .catch((err) => {
        console.error("Ошибка инициализации QR-сканера:", err);
      });

    return () => {
      html5Qr
        .stop()
        .then(() => {
          // Остановили сканер
        })
        .catch((err) => {
          console.error("Ошибка остановки сканера:", err);
        });
    };
  }, []);

  return (
    <div className="sc-container">
      <header className="sc-header">
        <button className="sc-back" onClick={() => navigate("/dashboard")}>
          ← Назад
        </button>
        <h2 className="sc-title">Сканер QR-кодов</h2>
        <div className="sc-usersection">
          <span>Оператор: {operatorName}</span>
          <button
            className="sc-logout"
            onClick={() => {
              onLogout();
              navigate("/");
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      <main className="sc-main">
        <div id="html5qr-code-region" ref={qrRegionRef} className="sc-qrregion" />
        <div className="sc-result">
          <strong>Результат сканирования:</strong> {lastResult}
        </div>
      </main>
    </div>
  );
}
