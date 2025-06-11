// StaffApp/src/components/BeachList.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import "./BeachList.css"; // стили для карточек

export default function BeachList({ beaches, bookings, operatorName, onLogout }) {
  const navigate = useNavigate();

  // Подготовим данные, сколько «активных» бронирований (pending или paid) на каждом пляже:
  const countByBeach = {};
  beaches.forEach((b) => {
    countByBeach[b.id] = 0;
  });
  bookings.forEach((booking) => {
    if (
      booking.status === "paid" ||
      booking.status === "pending"
    ) {
      if (countByBeach[booking.beachId] !== undefined) {
        countByBeach[booking.beachId]++;
      }
    }
  });

  return (
    <div className="bl-container">
      <header className="bl-header">
        <h1 className="bl-title">Панель персонала</h1>
        <div className="bl-user">
          <span className="bl-username">Сотрудник: {operatorName}</span>
          <button className="bl-logout" onClick={() => { onLogout(); navigate("/"); }}>
            Выйти
          </button>
        </div>
      </header>

      <main className="bl-main">
        <h2 className="bl-subtitle">Выберите пляж:</h2>
        <div className="bl-grid">
          {beaches.map((beach) => (
            <div
              key={beach.id}
              className={`bl-card ${beach.closed ? "bl-closed" : ""}`}
              onClick={() => {
                if (!beach.closed) {
                  navigate(`/beach/${beach.id}`);
                }
              }}
            >
              <div className="bl-card-name">{beach.name}</div>
              {beach.closed && <div className="bl-closed-label">Закрыт</div>}
              {!beach.closed && (
                <div className="bl-card-bookings">
                  Брони: {countByBeach[beach.id] || 0}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
