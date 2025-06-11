// StaffApp/src/utils/api.js

// Простейшая «заглушка» API. Возвращает список пляжей и их бронирований.
export async function getBeaches() {
  return [
    { id: 1, name: 'Пляж Северный', bookings: 12 },
    { id: 2, name: 'Пляж Восточный', bookings: 5 },
    { id: 3, name: 'Пляж Южный', bookings: 0 },
  ];
}

// Аналогично можно сделать getLoungeStatus, если нужен мок-статус шезлонгов:
export async function getLoungeStatus(beachId) {
  // вернём для примера статусы всех шезлонгов на этом пляже:
  return {
    loungers: [
      { id: 101, booked: true, date: '2025-06-02', time: '10:00–14:00' },
      { id: 102, booked: false, date: null, time: null },
      { id: 103, booked: true, date: '2025-06-02', time: '14:00–18:00' }
      // ... и т.д.
    ]
  };
}
