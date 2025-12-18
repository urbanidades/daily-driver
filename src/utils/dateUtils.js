/**
 * Date utility functions
 */

/**
 * Format a date as YYYY-MM-DD
 */
export function formatDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date for display (e.g., "Dec 17, Tue")
 */
export function formatDateDisplay(date) {
  const d = new Date(date);
  const options = { month: 'short', day: 'numeric', weekday: 'short' };
  return d.toLocaleDateString('en-US', options);
}

/**
 * Format a date for long display (e.g., "December 17, 2024")
 */
export function formatDateLong(date) {
  const d = new Date(date);
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}

/**
 * Get month and year string (e.g., "December 2024")
 */
export function formatMonthYear(date) {
  const d = new Date(date);
  const options = { month: 'long', year: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Check if a date is today
 */
export function isToday(date) {
  return isSameDay(date, new Date());
}

/**
 * Get the next day
 */
export function getNextDay(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d;
}

/**
 * Get the previous day
 */
export function getPreviousDay(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d;
}

/**
 * Add days to a date
 */
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Get calendar grid for a month (6 rows x 7 columns)
 * Returns array of weeks, each containing 7 day objects
 */
export function getCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
  
  const grid = [];
  let currentWeek = [];
  
  // Add days from previous month
  const prevMonth = new Date(year, month, 0);
  const daysInPrevMonth = prevMonth.getDate();
  
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    currentWeek.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
      day: daysInPrevMonth - i
    });
  }
  
  // Add days from current month
  for (let day = 1; day <= daysInMonth; day++) {
    if (currentWeek.length === 7) {
      grid.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push({
      date: new Date(year, month, day),
      isCurrentMonth: true,
      day
    });
  }
  
  // Add days from next month
  let nextMonthDay = 1;
  while (currentWeek.length < 7) {
    currentWeek.push({
      date: new Date(year, month + 1, nextMonthDay),
      isCurrentMonth: false,
      day: nextMonthDay
    });
    nextMonthDay++;
  }
  grid.push(currentWeek);
  
  // Ensure we have exactly 5 or 6 weeks
  while (grid.length < 5) {
    const nextWeek = [];
    for (let i = 0; i < 7; i++) {
      nextWeek.push({
        date: new Date(year, month + 1, nextMonthDay),
        isCurrentMonth: false,
        day: nextMonthDay
      });
      nextMonthDay++;
    }
    grid.push(nextWeek);
  }
  
  return grid;
}

/**
 * Get an array of weekday names
 */
export function getWeekdayNames(short = true) {
  const days = short 
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days;
}
