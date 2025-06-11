// File: src/components/LoungeStatus.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db, beachesCollectionRef, bookingsCollectionRef } from "../firebaseConfig";
import "./LoungeStatus.css";

export default function LoungeStatus({ operatorName, onLogout }) {
  const { beachId } = useParams();
  const navigate = useNavigate();

  const [beachData, setBeachData] = useState(null);
  const [beachBookings, setBeachBookings] = useState([]);
  const [loungerToBook, setLoungerToBook] = useState("");
  const [guestName, setGuestName] = useState("");
  const [bookingDateTime, setBookingDateTime] = useState("");

  // 1) Загрузка данных пляжа по ID (name, closed)
  useEffect(() => {
    async function fetchBeach() {
      try {
        const beachDocRef = doc(db, "beaches", beachId);
        const beachSnap = await getDoc(beachDocRef);
        if (beachSnap.exists()) {
          setBeachData({ id: beachSnap.id, ...beachSnap.data() });
        } else {
          console.warn("Пляж не найден в Firestore:", beachId);
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Ошибка при загрузке пляжа:", err);
      }
    }
    fetchBeach();
  }, [beachId, navigate]);

  // 2) Подписка на коллекцию bookings для данного пляжа
  useEffect(() => {
    if (!beachId) return;

    const bookingsQuery = query(
      collection(db, "bookings"),
      where("beachId", "==", beachId),
      orderBy("bookedFor", "asc")
    );

    const unsubscribe = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const arr = [];
        snapshot.forEach((doc) => {
          arr.push({ id: doc.id, ...doc.data() });
        });
        setBeachBookings(arr);
      },
      (error) => {
        console.error("Ошибка подписки на брони:", error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [beachId]);

  // 3) Закрыть / Открыть пляж (обновление поля closed)
  const toggleCloseBeach = async () => {
    if (!beachData) return;
    const confirmMsg = beachData.closed
      ? "Открыть пляж для бронирований?"
      : "Закрыть пляж? Новые брони будут заблокированы.";
    if (!window.confirm(confirmMsg)) return;

    try {
      const beachRef = doc(db, "beaches", beachId);
      await updateDoc(beachRef, { closed: !beachData.closed });
    } catch (err) {
      console.error("Ошибка при изменении статуса пляжа:", err);
      alert("Не удалось изменить статус пляжа. Смотрите консоль.");
    }
  };

  // 4) Отменить бронь (удаление документа)
  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Вы действительно хотите отменить эту бронь?")) return;
    try {
      await deleteDoc(doc(db, "bookings", bookingId));
    } catch (err) {
      console.error("Ошибка при удалении брони:", err);
      alert("Не удалось отменить бронь. Смотрите консоль.");
    }
  };

  // 5) Добавить новую бронь (от лица туриста)
  const createBooking = async (e) => {
    e.preventDefault();
    if (!loungerToBook.trim() || !guestName.trim() || !bookingDateTime) {
      alert("Заполните все поля для бронирования.");
      return;
    }
    const bookedForDate = new Date(bookingDateTime);
    if (isNaN(bookedForDate.getTime())) {
      alert("Неверный формат даты и времени.");
      return;
    }
    if (bookedForDate < new Date()) {
      alert("Нельзя забронировать прошедшее время.");
      return;
    }

    try {
      await addDoc(bookingsCollectionRef, {
        beachId,
        loungerNumber: loungerToBook.trim(),
        guestName: guestName.trim(),
        date: serverTimestamp(),
        bookedFor: bookedForDate,
        status: "pending",
        qrCodeData: "",
      });
      setLoungerToBook("");
      setGuestName("");
      setBookingDateTime("");
    } catch (err) {
      console.error("Ошибка при создании брони:", err);
      alert("Не удалось добавить бронь. Смотрите консоль.");
    }
  };

  if (!beachData) {
    return <div className="ls-loading">Загрузка данных пляжа...</div>;
  }

  return (
    <div className="ls-container">
      <header className="ls-header">
        <button className="ls-back" onClick={() => navigate("/dashboard")}>
          ← Назад
        </button>
        <h2 className="ls-title">Пляж: {beachData.name}</h2>
        <div className="ls-usersection">
          <span>Сотрудник: {operatorName}</span>
          <button
            className="ls-logout"
            onClick={() => {
              onLogout();
              navigate("/");
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      <main className="ls-main">
        <section className="ls-actions">
          <button className="ls-close" onClick={toggleCloseBeach}>
            {beachData.closed ? "Открыть пляж" : "Закрыть пляж"}
          </button>
        </section>

        {beachData.closed && (
          <div className="ls-closed-banner">
            <strong>Внимание:</strong> этот пляж закрыт для новых броней.
          </div>
        )}

        <section className="ls-bookings">
          <h3>Текущие и предстоящие брони</h3>
          {beachBookings.length === 0 ? (
            <p>Брони для этого пляжа отсутствуют.</p>
          ) : (
            <table className="ls-bookings-table">
              <thead>
                <tr>
                  <th>Гость</th>
                  <th>Шезлонг</th>
                  <th>Когда</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {beachBookings.map((b) => {
                  let bookedForStr = "—";
                  if (b.bookedFor) {
                    if (b.bookedFor.toDate) {
                      bookedForStr = b.bookedFor.toDate().toLocaleString();
                    } else if (b.bookedFor instanceof Date) {
                      bookedForStr = b.bookedFor.toLocaleString();
                    }
                  }
                  return (
                    <tr key={b.id}>
                      <td>{b.guestName}</td>
                      <td>{b.loungerNumber}</td>
                      <td>{bookedForStr}</td>
                      <td>{b.status}</td>
                      <td>
                        <button
                          className="ls-btn-cancel"
                          onClick={() => cancelBooking(b.id)}
                        >
                          Отменить
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {!beachData.closed && (
          <section className="ls-newbooking">
            <h3>Добавить бронь от лица туриста</h3>
            <form onSubmit={createBooking} className="ls-form">
              <div className="ls-form-group">
                <label>Имя гостя:</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>
              <div className="ls-form-group">
                <label>Шезлонг №:</label>
                <input
                  type="text"
                  value={loungerToBook}
                  onChange={(e) => setLoungerToBook(e.target.value)}
                  required
                />
              </div>
              <div className="ls-form-group">
                <label>Дата и время:</label>
                <input
                  type="datetime-local"
                  value={bookingDateTime}
                  onChange={(e) => setBookingDateTime(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="ls-btn-add">
                Добавить бронь
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
