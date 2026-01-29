import { useState } from 'react';
import { Container } from 'react-bootstrap';
import { Cinema } from '../types';
import FilmCard from './FilmCard';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

interface FilmListingsProps {
  cinemas: Cinema[];
}

const FilmListings = ({ cinemas }: FilmListingsProps) => {
  const [cinemaFilter, setCinemaFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');

  const today = getToday();
  const filteredCinemas = cinemas
    .filter(c => !cinemaFilter || c.name === cinemaFilter)
    .map(cinema => {
      const filteredFilms = cinema.films.filter(film => {
        if (!dayFilter) return true;
        return film.showtimes.some(s => {
          if (dayFilter === 'today') return s.date === today;
          return s.date === dayFilter;
        });
      });
      return { ...cinema, films: filteredFilms };
    })
    .filter(c => c.films.length > 0);

  const allDates = new Set<string>();
  cinemas
    .filter(c => !cinemaFilter || c.name === cinemaFilter)
    .forEach(c => {
      c.films.forEach(f => {
        f.showtimes.forEach(s => {
          if (s.date !== today) allDates.add(s.date);
        });
      });
    });
  const dayOptions = Array.from(allDates).sort().map(date => {
    const d = new Date(date + 'T12:00:00');
    const label = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    return { value: date, label };
  });

  return (
    <Container className="film-listings-container">
      <header className="film-listings-header">
        <h1>Film Listings</h1>
        <p className="subtitle">Showtimes from LAB111, Studio K, Filmhallen, Filmkoepel & The Movies</p>
      </header>

      <div className="film-filters">
        <select
          value={cinemaFilter}
          onChange={e => setCinemaFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Cinemas</option>
          {cinemas.map(c => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={dayFilter}
          onChange={e => setDayFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Days</option>
          <option value="today">Today</option>
          {dayOptions.map(day => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </div>

      {cinemas.length === 0 && <p className="no-results">No showtimes available</p>}

      {filteredCinemas.length === 0 && cinemas.length > 0 && (
        <p className="no-results">No showtimes found for selected filters</p>
      )}

      {filteredCinemas.map(cinema => (
        <div key={cinema.name} className="cinema-section">
          <h2>{cinema.name}</h2>
          {cinema.films.map((film, index) => (
            <FilmCard key={`${film.title}-${index}`} film={film} dayFilter={dayFilter} />
          ))}
        </div>
      ))}
    </Container>
  );
};

export default FilmListings;
