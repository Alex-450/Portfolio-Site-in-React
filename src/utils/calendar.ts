import { getCinema } from '../data/cinemas';

interface CalendarEventParams {
  filmTitle: string;
  cinemaName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  filmLengthMinutes: number;
  variant?: string | null;
}

function parseFilmLength(length: string | null): number {
  if (!length) return 120; // Default to 2 hours if unknown
  const match = length.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 120;
}

function formatDateTimeForCalendar(date: string, time: string): string {
  // Convert YYYY-MM-DD and HH:MM to YYYYMMDDTHHmmSS format
  const [year, month, day] = date.split('-');
  const [hours, minutes] = time.split(':');
  return `${year}${month}${day}T${hours}${minutes}00`;
}

function addMinutes(
  date: string,
  time: string,
  minutes: number
): { date: string; time: string } {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, mins] = time.split(':').map(Number);

  const d = new Date(year, month - 1, day, hours, mins);
  d.setMinutes(d.getMinutes() + minutes);

  const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const newTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  return { date: newDate, time: newTime };
}

export function generateGoogleCalendarUrl(params: CalendarEventParams): string {
  const cinema = getCinema(params.cinemaName);
  const adsMinutes = cinema?.adsMinutes ?? 20;

  // Calculate end time: start time + ads + film length
  const totalDuration = adsMinutes + params.filmLengthMinutes;
  const endDateTime = addMinutes(params.date, params.time, totalDuration);

  const startFormatted = formatDateTimeForCalendar(params.date, params.time);
  const endFormatted = formatDateTimeForCalendar(
    endDateTime.date,
    endDateTime.time
  );

  // Build event title
  let title = params.filmTitle;
  if (params.variant) {
    title += ` (${params.variant})`;
  }
  title += ` @ ${params.cinemaName}`;

  // Build description
  const description = [
    `Film: ${params.filmTitle}`,
    params.variant ? `Format: ${params.variant}` : null,
    `Runtime: ${params.filmLengthMinutes} minutes`,
    `Ads/trailers: ~${adsMinutes} minutes`,
    `Expected end: ~${endDateTime.time}`,
  ]
    .filter(Boolean)
    .join('\n');

  const location = cinema?.address ?? params.cinemaName;

  // Build Google Calendar URL
  const baseUrl = 'https://calendar.google.com/calendar/render';
  const queryParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startFormatted}/${endFormatted}`,
    details: description,
    location: location,
    ctz: 'Europe/Amsterdam',
  });

  return `${baseUrl}?${queryParams.toString()}`;
}

export function generateCalendarUrlFromFilm(
  filmTitle: string,
  filmLength: string | null,
  cinemaName: string,
  date: string,
  time: string,
  variant?: string | null
): string {
  return generateGoogleCalendarUrl({
    filmTitle,
    cinemaName,
    date,
    time,
    filmLengthMinutes: parseFilmLength(filmLength),
    variant,
  });
}
