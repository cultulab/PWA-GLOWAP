export const getWeekNumber = (d: Date): number => {
  // Copy date so don't modify original
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
};

export const getYearWeekString = (timestamp: number) => {
  const d = new Date(timestamp);
  const week = getWeekNumber(d);
  const year = d.getFullYear();
  return `${year}-W${week}`;
};

export const getDateRangeOfWeek = (w: number, y: number) => {
  const d = (1 + (w - 1) * 7); // 1st of January + 7 days for each week
  const simpleDate = new Date(y, 0, d);
  const dayOfWeek = simpleDate.getDay();
  const ISOweekStart = simpleDate;
  if (dayOfWeek <= 4)
      ISOweekStart.setDate(simpleDate.getDate() - simpleDate.getDay() + 1);
  else
      ISOweekStart.setDate(simpleDate.getDate() + 8 - simpleDate.getDay());
  
  const end = new Date(ISOweekStart);
  end.setDate(end.getDate() + 6);
  
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${ISOweekStart.toLocaleDateString('es-ES', options)} - ${end.toLocaleDateString('es-ES', options)}`;
};

export const isDateInCurrentWeek = (timestamp: number): boolean => {
  const date = new Date(timestamp);
  const now = new Date();
  
  // Checks if Year and Week Number match
  return getWeekNumber(date) === getWeekNumber(now) && date.getFullYear() === now.getFullYear();
};