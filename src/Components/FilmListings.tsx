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
          const day = new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' });
          return day === dayFilter;
        });
      });
      return { ...cinema, films: filteredFilms };
    })
    .filter(c => c.films.length > 0);

  const allDays = new Set<string>();
  cinemas.forEach(c => {
    c.films.forEach(f => {
      f.showtimes.forEach(s => {
        const day = new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' });
        allDays.add(day);
      });
    });
  });
  const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].filter(d => allDays.has(d));

  return (
    <Container className="film-listings-container">
      <header className="film-listings-header">
        <h1>Amsterdam Films</h1>
        <p className="subtitle">Showtimes from LAB111 & Studio K</p>
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
            <option key={day} value={day}>
              {day}
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
