// src/App.jsx

import React, { useState, useEffect } from "react";
import {
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  doc as firestoreDoc,
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { QrReader } from "react-qr-reader"; // убедитесь, что установили: npm install react-qr-reader

/**
 * Простой компонент входа (оператор).
 */
function LoginForm({ onLogin }) {
  const [loginValue, setLoginValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginValue.trim() !== "") {
      onLogin(loginValue.trim());
    } else {
      alert("Введите логин оператора");
    }
  };

  return (
    <div
      style={{
        background: "#DB7093",
        padding: 32,
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        width: 360,
      }}
    >
      <h2 style={{ color: "#fff", marginTop: 0, textAlign: "center" }}>
        Вход оператора
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              color: "#FFF",
              fontSize: 14,
            }}
          >
            Логин:
          </label>
          <input
            type="text"
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: 14,
              borderRadius: 6,
              border: "1px solid #fff",
              background: "#FFF",
              boxSizing: "border-box",
            }}
            placeholder="Введите логин"
          />
        </div>
        <button
          type="submit"
          style={{
            width: "100%",
            background: "#fff",
            color: "#DB7093",
            border: "none",
            padding: "12px 0",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Войти
        </button>
      </form>
    </div>
  );
}

// Ссылки на коллекции Firestore
const beachesColRef = collection(db, "beaches");
const bookingsColRef = collection(db, "bookings");

// Стартовые данные пляжей для первой инициализации
const initialBeaches = [
  {
    name: "Чайка",
    coords: [43.420374, 39.919106],
    area: [
      [43.420599, 39.912931],
      [43.420599, 39.925281],
      [43.420374, 39.925281],
      [43.420374, 39.912931],
    ],
    loungesCount: 50,
    price: 500,
    closed: false,
  },
  {
    name: "Огонёк",
    coords: [43.419, 39.916],
    area: [
      [43.419, 39.911053],
      [43.419, 39.920947],
      [43.418646, 39.920947],
      [43.418646, 39.911053],
    ],
    loungesCount: 50,
    price: 600,
    closed: false,
  },
  {
    name: "Мандарин",
    coords: [43.4177, 39.921855],
    area: [
      [43.41797, 39.920001],
      [43.41797, 39.923709],
      [43.4177, 39.923709],
      [43.4177, 39.920001],
    ],
    loungesCount: 50,
    price: 700,
    closed: false,
  },
  {
    name: "Южный_2",
    coords: [43.420374, 39.916636],
    area: [
      [43.420428, 39.914781],
      [43.420428, 39.918491],
      [43.420374, 39.918491],
      [43.420374, 39.914781],
    ],
    loungesCount: 50,
    price: 800,
    closed: false,
  },
  {
    name: "Бриз",
    coords: [43.408, 39.953],
    area: [
      [43.423, 39.938],
      [43.423, 39.968],
      [43.393, 39.968],
      [43.393, 39.938],
    ],
    loungesCount: 50,
    price: 900,
    closed: false,
  },
];

export default function App() {
  // === Состояния ===
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [operatorLogin, setOperatorLogin] = useState("");
  const [beaches, setBeaches] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedBeach, setSelectedBeach] = useState(null);

  // Режим «отмены» и выбранные шезлонги для отмены
  const [cancelMode, setCancelMode] = useState(false);
  const [selectedForCancel, setSelectedForCancel] = useState([]); // индексы выбранных (0-based)

  // Поля формы бронирования (администратор)
  const [bookingLoungerNumber, setBookingLoungerNumber] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingHourStart, setBookingHourStart] = useState("07");
  const [bookingMinuteStart, setBookingMinuteStart] = useState("00");
  const [bookingHourEnd, setBookingHourEnd] = useState("08");
  const [bookingMinuteEnd, setBookingMinuteEnd] = useState("00");

  const [showForm, setShowForm] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("environment");

  const [qrData, setQrData] = useState("");

  // === Инициализация коллекции «beaches» (первый запуск) ===
  useEffect(() => {
    (async () => {
      try {
        const snapshot = await getDocs(beachesColRef);
        if (snapshot.empty) {
          // Если коллекция пуста, добавляем исходные пляжи
          for (const beach of initialBeaches) {
            const beachId = beach.name.replace(/\s+/g, "_");
            await setDoc(firestoreDoc(db, "beaches", beachId), {
              name: beach.name,
              coords: beach.coords,
              area: beach.area.map(([lat, lng]) => ({ lat, lng })),
              loungers: Array(beach.loungesCount).fill(false),
              price: beach.price,
              closed: beach.closed,
            });
          }
        }
      } catch (err) {
        console.error("Ошибка инициализации пляжей:", err);
      }
    })();
  }, []);

  // === Подписки на Firestore: пляжи и бронирования ===
  useEffect(() => {
    const unsubBeaches = onSnapshot(beachesColRef, (snapshot) => {
      const arr = [];
      snapshot.forEach((docSnap) => arr.push({ id: docSnap.id, ...docSnap.data() }));
      setBeaches(arr);
    });
    const unsubBookings = onSnapshot(bookingsColRef, (snapshot) => {
      const arr2 = [];
      snapshot.forEach((docSnap) => arr2.push({ id: docSnap.id, ...docSnap.data() }));
      setBookings(arr2);
    });
    return () => {
      unsubBeaches();
      unsubBookings();
    };
  }, []);

  // === Локальный logout (сбрасываем всё) ===
  const handleLogout = () => {
    setIsLoggedIn(false);
    setOperatorLogin("");
    setSelectedBeach(null);
  };

  // === Переключаем статус пляжа «закрыт/открыт» ===
  const toggleBeachStatus = async (beachId, currentClosed) => {
    try {
      const beachRef = firestoreDoc(db, "beaches", beachId);
      await updateDoc(beachRef, { closed: !currentClosed });
    } catch (err) {
      console.error("Не удалось переключить статус пляжа:", err);
      alert("Ошибка при изменении статуса пляжа.");
    }
  };

  // === Открываем схему лежаков ===
  const openLoungersView = (beach) => {
    setSelectedBeach(beach);
    setShowForm(false);
    setScanning(false);
    setQrData("");
    // Сброс формы бронирования
    setBookingLoungerNumber("");
    setBookingPhone("");
    setBookingDate("");
    setBookingHourStart("07");
    setBookingMinuteStart("00");
    setBookingHourEnd("08");
    setBookingMinuteEnd("00");
    // Сброс режима отмены
    setCancelMode(false);
    setSelectedForCancel([]);
  };
  const closeLoungersView = () => {
    setSelectedBeach(null);
    setShowForm(false);
    setScanning(false);
    setCancelMode(false);
    setSelectedForCancel([]);
  };

  // === Вычисляем «статусы» лежаков для выбранного пляжа по текущему времени ===
  const computeLoungerStatuses = (beach) => {
    if (!beach) return [];
    const loungesArr = Array.isArray(beach.loungers) ? beach.loungers : [];
    const statuses = loungesArr.map(() => "free");
    const now = new Date();
    const todayISO = now.toISOString().slice(0, 10); // «YYYY-MM-DD»

    // Ищем все бронирования на текущий пляж и на текущую дату
    const todaysBookings = bookings.filter(
      (b) => b.beachId === beach.id && b.bookingDate === todayISO
    );
    todaysBookings.forEach((b) => {
      const bStart = new Date(`${b.bookingDate}T${b.bookingTimeStart}:00`);
      const bEnd = new Date(`${b.bookingDate}T${b.bookingTimeEnd}:00`);
      if (Array.isArray(b.loungers)) {
        b.loungers.forEach((number) => {
          const idx = number - 1;
          if (idx >= 0 && idx < statuses.length) {
            if (now >= bStart && now < bEnd) {
              statuses[idx] = "occupied";
            }
          }
        });
      }
    });
    return statuses;
  };
  const loungerStatuses = selectedBeach ? computeLoungerStatuses(selectedBeach) : [];

  // === Будущие бронирования для текущего пляжа ===
  const futureBookings = selectedBeach
    ? bookings
        .filter((b) => b.beachId === selectedBeach.id)
        .filter((b) => new Date(`${b.bookingDate}T${b.bookingTimeStart}:00`) > new Date())
    : [];

  // === Показать / скрыть форму бронирования ===
  const handleShowForm = () => {
    setShowForm(true);
    setScanning(false);
    setQrData("");
    setCancelMode(false);
    setSelectedForCancel([]);
  };
  const handleHideForm = () => {
    setShowForm(false);
    setQrData("");
    setScanning(false);
  };

  // === Бронирование лежака (администратор) ===
  const handleAdminBookInSchema = async (e) => {
    e.preventDefault();
    const beach = selectedBeach;
    if (!beach) return;
    if (beach.closed) {
      alert("Нельзя забронировать: пляж закрыт.");
      return;
    }

    const rawNumber = bookingLoungerNumber.trim();
    const loungerNumber = parseInt(rawNumber, 10);
    if (
      isNaN(loungerNumber) ||
      loungerNumber < 1 ||
      !Array.isArray(beach.loungers) ||
      loungerNumber > beach.loungers.length
    ) {
      alert(`Введите корректный номер лежака от 1 до ${beach.loungers.length}.`);
      return;
    }
    if (!bookingPhone.trim() || !bookingDate) {
      alert("Пожалуйста, заполните все поля формы.");
      return;
    }

    const startTimeStr = `${bookingHourStart}:${bookingMinuteStart}`;
    const endTimeStr = `${bookingHourEnd}:${bookingMinuteEnd}`;
    const startDateTime = new Date(`${bookingDate}T${startTimeStr}:00`);
    const endDateTime = new Date(`${bookingDate}T${endTimeStr}:00`);

    if (startDateTime >= endDateTime) {
      alert("Время окончания должно быть позже времени начала.");
      return;
    }

    // Проверяем пересечения с другими бронированиями
    const existing = bookings.filter(
      (b) =>
        b.beachId === beach.id &&
        Array.isArray(b.loungers) &&
        b.loungers.includes(loungerNumber) &&
        new Date(`${b.bookingDate}T${b.bookingTimeStart}:00`) < endDateTime &&
        new Date(`${b.bookingDate}T${b.bookingTimeEnd}:00`) > startDateTime
    );
    if (existing.length > 0) {
      const b = existing[0];
      alert(
        `Лежак #${loungerNumber} уже занят ${b.bookingDate} ${b.bookingTimeStart}–${b.bookingTimeEnd}.`
      );
      return;
    }

    const newBooking = {
      beachName: beach.name,
      beachId: beach.id,
      userPhone: bookingPhone.trim(),
      loungers: [loungerNumber],
      bookingDate: bookingDate,
      bookingTimeStart: startTimeStr,
      bookingTimeEnd: endTimeStr,
      price: beach.price,
      status: "paid",
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(bookingsColRef, newBooking);
      // Обновляем массив loungers у пляжа (ставим «true» для забронированного)
      const beachRef = firestoreDoc(db, "beaches", beach.id);
      const updatedLoungers = Array.isArray(beach.loungers)
        ? [...beach.loungers]
        : Array(beach.loungesCount).fill(false);
      updatedLoungers[loungerNumber - 1] = true;
      await updateDoc(beachRef, { loungers: updatedLoungers });

      alert(`Лежак №${loungerNumber} забронирован.`);
      const qrText = `Booking:${docRef.id}`;
      setQrData(qrText);
      setShowForm(false);
      setScanning(false);

      setBookingLoungerNumber("");
      setBookingPhone("");
      setBookingDate("");
      setBookingHourStart("07");
      setBookingMinuteStart("00");
      setBookingHourEnd("08");
      setBookingMinuteEnd("00");
    } catch (err) {
      console.error("Ошибка при бронировании лежака:", err);
      alert("Не удалось забронировать лежак. Проверьте права доступа в Firestore.");
    }
  };

  // === Отмена отдельного бронирования по ID (в списке «Будущих бронирований») ===
  const handleCancelBooking = async (bookingId) => {
    const confirmDelete = window.confirm("Вы уверены, что хотите отменить это бронирование?");
    if (!confirmDelete) return;
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      if (booking) {
        const beachData = beaches.find((be) => be.id === booking.beachId);
        if (beachData && Array.isArray(beachData.loungers)) {
          const beachRef = firestoreDoc(db, "beaches", booking.beachId);
          const updatedLoungers = [...beachData.loungers];
          booking.loungers.forEach((ln) => {
            const idx = ln - 1;
            if (idx >= 0 && idx < updatedLoungers.length) {
              updatedLoungers[idx] = false;
            }
          });
          await updateDoc(beachRef, { loungers: updatedLoungers });
        }
      }
      await deleteDoc(firestoreDoc(db, "bookings", bookingId));
      alert("Бронирование отменено.");
    } catch (err) {
      console.error("Ошибка при отмене бронирования:", err);
      alert("Не удалось отменить бронирование. Проверьте права доступа.");
    }
  };

  // === Отмена выбранных шезлонгов (в режиме cancelMode) ===
  const handlePerformCancel = async () => {
    if (selectedForCancel.length === 0) {
      alert("Не выбрано ни одного шезлонга для отмены.");
      return;
    }

    const confirmDelete = window.confirm(
      `Вы действительно хотите отменить ${selectedForCancel.length} шезлонг(ов)?`
    );
    if (!confirmDelete) return;

    try {
      // 1) Читаем свежий документ пляжа из Firestore:
      const beachRef = firestoreDoc(db, "beaches", selectedBeach.id);
      const beachSnap = await getDoc(beachRef);
      if (!beachSnap.exists()) {
        alert("Не удалось найти документ пляжа.");
        return;
      }
      // Клонируем массив loungers (актуальное состояние)
      const actualLoungers = [...beachSnap.data().loungers];

      // 2) Для каждого выбранного индекса удаляем бронирование и снимаем флаг
      for (let idx of selectedForCancel) {
        const loungerNumber = idx + 1;
        // Находим все документы, где участвует этот номер лежака
        const bookingsToDelete = bookings.filter(
          (b) =>
            b.beachId === selectedBeach.id &&
            Array.isArray(b.loungers) &&
            b.loungers.includes(loungerNumber)
        );

        // Удаляем найденные документы-брони
        for (let b of bookingsToDelete) {
          await deleteDoc(firestoreDoc(db, "bookings", b.id));
        }

        // Если удалили хотя бы одну бронь — освобождаем лежак в самом пляже
        if (bookingsToDelete.length > 0) {
          actualLoungers[idx] = false;
        }
      }

      // 3) Записываем обратно обновлённый массив loungers в документ пляжа:
      await updateDoc(beachRef, { loungers: actualLoungers });

      alert("Выбранные шезлонги освобождены.");
      setCancelMode(false);
      setSelectedForCancel([]);
    } catch (err) {
      console.error("Ошибка при отмене выбранных шезлонгов:", err);
      alert("Не удалось отменить выбранные шезлонги. Проверьте права доступа.");
    }
  };

  // === Если оператор не залогинен — показываем экран входа ===
  if (!isLoggedIn) {
    return (
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100vw",
          height: "100vh",
          background: "#f2f2f2",
        }}
      >
        <LoginForm
          onLogin={(loginValue) => {
            setOperatorLogin(loginValue);
            setIsLoggedIn(true);
          }}
        />
      </div>
    );
  }

  // === Основной интерфейс «Панель персонала» ===
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        minHeight: "100vh",
        background: "#fafafa",
      }}
    >
      {/* ======== Header ======== */}
      <header
        style={{
          background: "#DB7093",
          color: "#fff",
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <h1 style={{ margin: 0, fontSize: "20px" }}>Панель персонала</h1>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ marginRight: 16, fontSize: 16 }}>
            Оператор: {operatorLogin}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: "#fff",
              color: "#DB7093",
              border: "none",
              padding: "6px 12px",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      {/* ======== Main ======== */}
      <main style={{ padding: "20px", maxWidth: 1100, margin: "0 auto" }}>
        {selectedBeach === null ? (
          // ===== Список карточек пляжей =====
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {beaches.map((beach) => (
              <div
                key={beach.id}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: 22 }}>{beach.name}</h2>
                  <p style={{ margin: "8px 0", fontSize: 14, color: "#555" }}>
                    {beach.closed ? (
                      <span style={{ color: "#D32F2F", fontWeight: 600 }}>Закрыт</span>
                    ) : (
                      <span style={{ color: "#388E3C", fontWeight: 600 }}>Открыт</span>
                    )}
                  </p>
                  <p style={{ margin: "4px 0", fontSize: 14, color: "#777" }}>
                    Цена: {typeof beach.price === "number" ? beach.price : 0} руб./час
                  </p>
                  <p style={{ margin: "4px 0", fontSize: 14, color: "#777" }}>
                    Всего лежаков: {Array.isArray(beach.loungers) ? beach.loungers.length : 0}
                  </p>
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button
                    onClick={() => toggleBeachStatus(beach.id, beach.closed)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: beach.closed ? "#388E3C" : "#D32F2F",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {beach.closed ? "Открыть пляж" : "Закрыть пляж"}
                  </button>
                  <button
                    onClick={() => openLoungersView(beach)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      background: "#1976D2",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Схема лежаков
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // ===== Схема лежаков выбранного пляжа =====
          <div>
            <button
              onClick={closeLoungersView}
              style={{
                marginBottom: 16,
                background: "#FFCDD2",
                color: "#D32F2F",
                border: "none",
                padding: "8px 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              ← Назад к списку пляжей
            </button>
            <h2 style={{ marginTop: 0, fontSize: 24, color: "#333" }}>
              {selectedBeach.name} — схема лежаков
              {selectedBeach.closed && (
                <span
                  style={{
                    marginLeft: 12,
                    padding: "4px 8px",
                    background: "#D32F2F",
                    color: "#fff",
                    fontSize: 14,
                    borderRadius: 6,
                  }}
                >
                  Закрыт
                </span>
              )}
            </h2>

            {/* ===== Сетка лежаков ===== */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, 48px)",
                gap: 12,
                marginTop: 20,
                opacity: selectedBeach.closed ? 0.5 : 1,
                pointerEvents: selectedBeach.closed ? "none" : "auto",
              }}
            >
              {(Array.isArray(selectedBeach.loungers) ? selectedBeach.loungers : []).map(
                (_, idx
              ) => {
                const status = loungerStatuses[idx] || "free";
                let bgColor = "#4CAF50"; // free (зелёный)
                if (status === "occupied") bgColor = "#D32F2F"; // occupied (красный)

                // Если в режиме отмены и индекс выбран — фиолетовый
                if (cancelMode && selectedForCancel.includes(idx)) {
                  bgColor = "#9C27B0";
                }

                return (
                  <div
                    key={idx}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      background: bgColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: cancelMode
                        ? status === "occupied"
                          ? "pointer"
                          : "not-allowed"
                        : "default",
                    }}
                    onClick={() => {
                      if (!cancelMode) return;
                      if (status !== "occupied") return;
                      setSelectedForCancel((prev) => {
                        if (prev.includes(idx)) {
                          // Если уже был в списке — убираем
                          return prev.filter((i) => i !== idx);
                        } else {
                          // Добавляем индекс
                          return [...prev, idx];
                        }
                      });
                    }}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>

            {/* ===== Кнопки «Забронировать / Сканер / Отменить» ===== */}
            {!showForm && !scanning && (
              <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
                {/* Кнопка «Забронировать» */}
                <button
                  onClick={handleShowForm}
                  style={{
                    background: "#FF9800",
                    color: "#fff",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  Забронировать
                </button>

                {/* Кнопка «Сканер» */}
                <button
                  onClick={() => {
                    setCameraFacing("environment");
                    setScanning(true);
                    setShowForm(false);
                    setQrData("");
                    setCancelMode(false);
                    setSelectedForCancel([]);
                  }}
                  style={{
                    background: "#4CAF50",
                    color: "#fff",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  Сканер
                </button>

                {/* Кнопка «Отменить» */}
                <button
                  onClick={() => {
                    if (!cancelMode) {
                      // Войти в режим выбора шезлонгов для отмены
                      setCancelMode(true);
                    } else {
                      // Подтвердить отмену выбранных
                      handlePerformCancel();
                    }
                  }}
                  style={{
                    background: cancelMode ? "#9C27B0" : "#D32F2F",
                    color: "#fff",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {cancelMode ? "Подтвердить отмену" : "Отменить"}
                </button>
              </div>
            )}

            {/* ===== Форма бронирования ===== */}
            {showForm && (
              <form
                onSubmit={handleAdminBookInSchema}
                style={{
                  marginTop: 24,
                  background: "#fff",
                  padding: 20,
                  borderRadius: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  position: "relative",
                }}
              >
                <button
                  onClick={handleHideForm}
                  type="button"
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    background: "transparent",
                    border: "none",
                    fontSize: 18,
                    cursor: "pointer",
                    color: "#555",
                  }}
                >
                  ×
                </button>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                    № лежака:
                  </label>
                  <input
                    type="number"
                    value={bookingLoungerNumber}
                    onChange={(e) => setBookingLoungerNumber(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: 14,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                    }}
                    min={1}
                    max={selectedBeach.loungers.length}
                    placeholder={`1–${selectedBeach.loungers.length}`}
                    required
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                    Телефон:
                  </label>
                  <input
                    type="tel"
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: 14,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                    }}
                    placeholder="+7(XXX)XXX-XX-XX"
                    required
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                    Дата:
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: 14,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                    }}
                    required
                  />
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                      Время начала:
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select
                        value={bookingHourStart}
                        onChange={(e) => setBookingHourStart(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "8px 10px",
                          fontSize: 14,
                          borderRadius: 6,
                          border: "1px solid #ccc",
                          background: "#fff",
                        }}
                        required
                      >
                        {Array.from({ length: 14 }, (_, i) => 7 + i).map((h) => {
                          const hh = h < 10 ? `0${h}` : `${h}`;
                          return (
                            <option key={hh} value={hh}>
                              {hh}
                            </option>
                          );
                        })}
                      </select>
                      <select
                        value={bookingMinuteStart}
                        onChange={(e) => setBookingMinuteStart(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "8px 10px",
                          fontSize: 14,
                          borderRadius: 6,
                          border: "1px solid #ccc",
                          background: "#fff",
                        }}
                        required
                      >
                        {Array.from({ length: 60 }, (_, i) => i).map((m) => {
                          const mm = m < 10 ? `0${m}` : `${m}`;
                          return (
                            <option key={mm} value={mm}>
                              {mm}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 14, marginBottom: 4, display: "block" }}>
                      Время окончания:
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select
                        value={bookingHourEnd}
                        onChange={(e) => setBookingHourEnd(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "8px 10px",
                          fontSize: 14,
                          borderRadius: 6,
                          border: "1px solid #ccc",
                          background: "#fff",
                        }}
                        required
                      >
                        {Array.from({ length: 14 }, (_, i) => 7 + i).map((h) => {
                          const hh = h < 10 ? `0${h}` : `${h}`;
                          return (
                            <option key={hh} value={hh}>
                              {hh}
                            </option>
                          );
                        })}
                      </select>
                      <select
                        value={bookingMinuteEnd}
                        onChange={(e) => setBookingMinuteEnd(e.target.value)}
                        style={{
                          flex: 1,
                          padding: "8px 10px",
                          fontSize: 14,
                          borderRadius: 6,
                          border: "1px solid #ccc",
                          background: "#fff",
                        }}
                        required
                      >
                        {Array.from({ length: 60 }, (_, i) => i).map((m) => {
                          const mm = m < 10 ? `0${m}` : `${m}`;
                          return (
                            <option key={mm} value={mm}>
                              {mm}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  style={{
                    background: "#0288D1",
                    color: "#fff",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  Забронировать
                </button>
              </form>
            )}

            {/* ===== QR-сканер ===== */}
            {scanning && (
              <div
                style={{
                  marginTop: 24,
                  background: "#fff",
                  padding: 20,
                  borderRadius: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  position: "relative",
                }}
              >
                <button
                  onClick={() => setScanning(false)}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    background: "transparent",
                    border: "none",
                    fontSize: 18,
                    cursor: "pointer",
                    color: "#555",
                  }}
                >
                  ×
                </button>
                <h3 style={{ textAlign: "center", marginBottom: 12 }}>
                  Отсканируйте QR-код клиента
                </h3>
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <button
                    onClick={() => {
                      setCameraFacing((prev) =>
                        prev === "environment" ? "user" : "environment"
                      );
                    }}
                    style={{
                      background: "#1976D2",
                      color: "#fff",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: 6,
                      cursor: "pointer",
                      marginBottom: 12,
                      fontSize: 14,
                    }}
                  >
                    {cameraFacing === "environment"
                      ? "Переключить на фронтальную"
                      : "Переключить на заднюю"}
                  </button>
                </div>
                <QrReader
                  videoConstraints={{ facingMode: cameraFacing }}
                  scanDelay={300}
                  onError={(err) => {
                    console.error(err);
                    alert("Ошибка сканирования: " + err);
                    setScanning(false);
                  }}
                  onResult={(result, error) => {
                    if (!!result) {
                      alert(`Отсканировано: ${result?.text}`);
                      setScanning(false);
                    }
                  }}
                  style={{ width: "100%" }}
                />
              </div>
            )}

            {/* ===== QR-код после бронирования ===== */}
            {qrData && (
              <div
                style={{
                  marginTop: 24,
                  background: "#fff",
                  padding: 20,
                  borderRadius: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  position: "relative",
                }}
              >
                <button
                  onClick={() => setQrData("")}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    background: "transparent",
                    border: "none",
                    fontSize: 18,
                    cursor: "pointer",
                    color: "#555",
                  }}
                >
                  ×
                </button>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 16, marginBottom: 8 }}>QR-код бронирования:</p>
                  <div
                    style={{
                      margin: "0 auto",
                      width: 180,
                      height: 180,
                      background: "#eee",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#999",
                      fontSize: 14,
                      borderRadius: 8,
                    }}
                  >
                    {qrData}
                  </div>
                  <p style={{ fontSize: 12, color: "#555", marginTop: 8 }}>
                    Сфотографируйте QR-код для подтверждения брони
                  </p>
                </div>
              </div>
            )}

            {/* ===== Список будущих бронирований ===== */}
            {futureBookings.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 18, color: "#333" }}>Будущие бронирования:</h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  {futureBookings.map((b) => (
                    <div
                      key={b.id}
                      style={{
                        background: "rgba(0,0,0,0.05)",
                        borderRadius: 8,
                        padding: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: 14, color: "#222" }}>
                        Шезлонг #{b.loungers[0]} ({b.bookingDate} {b.bookingTimeStart} -{" "}
                        {b.bookingTimeEnd})
                      </span>
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        style={{
                          background: "#D32F2F",
                          color: "#fff",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Отменить
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
