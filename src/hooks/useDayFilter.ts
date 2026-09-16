import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { FilmWithCinemasLite } from '../types';
import { defaultListingDate, formatDate } from '../utils/date';

// URL sentinel for "user explicitly cleared the day filter".
export const ALL_DAYS = 'all';

export interface DayOption {
  value: string;
  label: string;
}

interface UseDayFilterArgs {
  // Films matching every filter except day/time. Day options are derived from
  // this so the dropdown never offers a day the other filters can't satisfy.
  filmsIgnoringDay: FilmWithCinemasLite[];
  // Whether any non-day filter (cinema, genre, director, …) is active.
  hasNonDayFilters: boolean;
  today: string;
  currentTime: string;
}

export interface UseDayFilterResult {
  // The day filter to actually apply — the user's choice, or the default.
  dayFilter: string[];
  // Only the days the user explicitly chose; empty when the default applies or
  // the filter was cleared. This is what gets a removable chip each.
  selectedDays: string[];
  // The default day, when one is being applied. Null otherwise.
  defaultDay: string | null;
  // True when `dayFilter` holds the default rather than a user choice.
  isDefaultDay: boolean;
  dayOptions: DayOption[];
  hasShowtimesToday: boolean;
  hasEveningShowtimesToday: boolean;
  setDayFilter: (days: string[]) => void;
  getDayLabel: (day: string) => string;
}

/**
 * Owns the day filter, including its two pieces of hidden state.
 *
 * The `day` query param has three meanings, not two:
 *
 *   missing   — no choice made; the default day applies (landing view only)
 *   `all`     — the user actively cleared it; show every day
 *   a list    — an explicit choice, e.g. `today` or `2026-09-19`
 *
 * `all` exists because absence already means "apply the default". Without a
 * distinct sentinel, clearing the default day would drop the param, the default
 * would immediately come back, and the filter could never be removed.
 *
 * The default applies only on the unfiltered landing view. Once the user has
 * narrowed by director/genre/cinema/etc the day constraint is dropped, since a
 * director who isn't screening today would otherwise yield an empty list for a
 * reason the user never chose.
 */
export function useDayFilter({
  filmsIgnoringDay,
  hasNonDayFilters,
  today,
  currentTime,
}: UseDayFilterArgs): UseDayFilterResult {
  const router = useRouter();
  const dayRaw = typeof router.query.day === 'string' ? router.query.day : '';

  const dayCleared = dayRaw === ALL_DAYS;
  const explicitDayFilter = useMemo(
    () => (dayRaw === ALL_DAYS ? [] : dayRaw.split(',').filter(Boolean)),
    [dayRaw]
  );

  // Emptying the day filter is recorded as the sentinel rather than by dropping
  // the param — see the note on the three meanings above.
  const setDayFilter = useCallback(
    (days: string[]) => {
      const query = { ...router.query };
      query.day = days.length ? days.join(',') : ALL_DAYS;
      router.push({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    },
    [router]
  );

  const { dayOptions, hasShowtimesToday, hasEveningShowtimesToday } =
    useMemo(() => {
      const allDates = new Set<string>();
      filmsIgnoringDay.forEach((film) => {
        film.cinemaShowtimes.forEach((cs) => {
          cs.showtimes.forEach((s) => {
            if (s.date !== today) allDates.add(s.date);
          });
        });
      });
      const hasShowtimesToday = filmsIgnoringDay.some((film) =>
        film.cinemaShowtimes.some((cs) =>
          cs.showtimes.some((s) => s.date === today)
        )
      );
      const hasEveningShowtimesToday = filmsIgnoringDay.some((film) =>
        film.cinemaShowtimes.some((cs) =>
          cs.showtimes.some((s) => s.date === today && s.time >= '18:00')
        )
      );
      const dayOptions = Array.from(allDates)
        .sort()
        .map((date) => ({ value: date, label: formatDate(date) }));
      return { dayOptions, hasShowtimesToday, hasEveningShowtimesToday };
    }, [filmsIgnoringDay, today]);

  // Listings land on a single day: today, or the next day with showtimes once
  // today is over. Showing every future date at once is overwhelming on load.
  const defaultDay = useMemo(() => {
    const date = defaultListingDate(filmsIgnoringDay, today, currentTime);
    if (date === null) return null;
    return date === today ? 'today' : date;
  }, [filmsIgnoringDay, today, currentTime]);

  const isDefaultDay =
    !dayCleared &&
    !hasNonDayFilters &&
    explicitDayFilter.length === 0 &&
    defaultDay !== null;

  const dayFilter = useMemo(
    () => (isDefaultDay ? [defaultDay as string] : explicitDayFilter),
    [isDefaultDay, defaultDay, explicitDayFilter]
  );

  const validDayValues = useMemo(() => {
    const values = new Set(['today', ...dayOptions.map((d) => d.value)]);
    if (!hasShowtimesToday) values.delete('today');
    return values;
  }, [dayOptions, hasShowtimesToday]);

  // Drop day values that have gone stale (e.g. the date rolled over). Dropping
  // the param rather than writing the sentinel is right: a filter that expired
  // isn't the user clearing it, so the default should apply again.
  useEffect(() => {
    const hasInvalid = explicitDayFilter.some((d) => !validDayValues.has(d));
    if (!hasInvalid) return;
    const validDays = explicitDayFilter.filter((d) => validDayValues.has(d));
    const query = { ...router.query };
    if (validDays.length > 0) {
      query.day = validDays.join(',');
    } else {
      delete query.day;
    }
    router.replace({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });
  }, [explicitDayFilter, validDayValues, router]);

  // The sentinel only means anything while the default would otherwise apply.
  // Once another filter is active the default is already off, so the param is a
  // no-op — drop it rather than let it trail through shared URLs.
  useEffect(() => {
    if (!dayCleared || !hasNonDayFilters) return;
    const query = { ...router.query };
    delete query.day;
    router.replace({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });
  }, [dayCleared, hasNonDayFilters, router]);

  const getDayLabel = useCallback(
    (day: string) => {
      if (day === 'today') return 'Today';
      return dayOptions.find((d) => d.value === day)?.label ?? day;
    },
    [dayOptions]
  );

  return {
    dayFilter,
    selectedDays: explicitDayFilter,
    defaultDay,
    isDefaultDay,
    dayOptions,
    hasShowtimesToday,
    hasEveningShowtimesToday,
    setDayFilter,
    getDayLabel,
  };
}
