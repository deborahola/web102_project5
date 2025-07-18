import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [breweries, setBreweries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filteredBreweries, setFilteredBreweries] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stateFilter, setStateFilter] = useState([]);
  const [zipFilter, setZipFilter] = useState(99999);
  const [zipMax, setZipMax] = useState(99999);

  const [availableTypes, setAvailableTypes] = useState([]);
  const [availableStates, setAvailableStates] = useState([]);


  function shuffle(array) {
    return [...array].sort(() => Math.random() - 0.5);
  }


  useEffect(() => {
    async function fetchBreweries() {
      try {
        const response = await fetch('https://api.openbrewerydb.org/v1/breweries?per_page=200');
        let data = await response.json();

        data = data.filter(b => b.country == 'United States');

        let shuffled = shuffle(data);
        const min = 40;
        const max = shuffled.length;
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        shuffled = shuffled.slice(0, randomNumber);
        setBreweries(shuffled);
        setFilteredBreweries(shuffled);

        const types = [...new Set(shuffled.map(b => b.brewery_type).filter(Boolean))];
        const states = [...new Set(shuffled.map(b => b.state).filter(Boolean))];
        setAvailableTypes(types.sort());
        setAvailableStates(states.sort());

        const zipCodes = shuffled.map(b => parseInt(b.postal_code?.split('-')[0])).filter(zip => !isNaN(zip));
        const maxZipRaw = Math.max(...zipCodes);
        const roundedMaxZip = Math.ceil(maxZipRaw / 1000) * 1000;
        setZipFilter(roundedMaxZip);
        setZipMax(roundedMaxZip);
      } catch (error) {
        console.error('Failed to fetch breweries:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBreweries();
  }, []);


  useEffect(() => {
    let results = breweries;

    if (search) {
      results = results.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
    }

    if (typeFilter) {
      results = results.filter(b => b.brewery_type === typeFilter);
    }
    
    if (stateFilter.length > 0) {
      results = results.filter(b => stateFilter.includes(b.state));
    }

    results = results.filter((b) => {
      const zip = parseInt(b.postal_code?.split('-')[0]);
      return !isNaN(zip) && zip <= zipFilter;
    });

    setFilteredBreweries(results);
  }, [search, typeFilter, stateFilter, zipFilter, breweries]);


  const total = breweries.length;
  const withWebsite = breweries.filter(b => b.website_url).length;
  const cities = new Set(breweries.map((b) => b.city)).size;
  const avgZip = Math.floor(
    breweries.reduce((acc, b) => acc + (parseInt(b.postal_code?.split('-')[0]) || 0), 0) / total
  );
  const modeType = breweries.reduce((acc, b) => {
    acc[b.brewery_type] = (acc[b.brewery_type] || 0) + 1;
    return acc;
  }, {});
  const mostCommonType = Object.entries(modeType).sort((a, b) => b[1] - a[1])[0]?.[0];


  function handleStateCheckbox(e) {
    const value = e.target.value;
    setStateFilter(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    );
  }


  return (
    <div className="container">
      <header>
        <h1>🍺 Brewery Dashboard 🍺</h1>
        <p className="subtitle">Explore breweries across the U.S. using filters and live search!</p>
      </header>

      {loading ? (
        <p className="loading">Loading breweries...</p>
      ) : (
        <>
          <div className="stats">
            <div className="stat">Total: {total}</div>
            <div className="stat">With Websites: {(withWebsite / total * 100).toFixed(1)}%</div>
            <div className="stat">Unique Cities: {cities}</div>
            <div className="stat">Avg ZIP Code: {avgZip}</div>
            <div className="stat">Most Common Type: {mostCommonType.charAt(0).toUpperCase() + mostCommonType.slice(1)}</div>
          </div>

          <div className="refresh-container">
            <button className="refresh-btn" onClick={() => window.location.reload()}>
              Refresh &nbsp;🔄
            </button>
          </div>

          <div className="filters">
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">Filter by Type</option>
              {availableTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
            <label className="slider-label">
              Max ZIP Code: {zipFilter}
              <input
                type="range"
                min="10000"
                max={zipMax}
                step="1000"
                value={zipFilter}
                onChange={(e) => setZipFilter(e.target.value)}
              />
            </label>
            <div className="state-filter">
              <span className="state-filter-title">Filter by State:</span>
              {availableStates.map(state => (
                <label key={state}>
                  <input
                    type="checkbox"
                    value={state}
                    checked={stateFilter.includes(state)}
                    onChange={handleStateCheckbox}
                  />
                  {state}
                </label>
              ))}
            </div>
          </div>

          <ul className="brewery-list">
            {filteredBreweries.map(b => (
              <li key={b.id} className="brewery-card">
                <h2>{b.name}</h2>
                <p><strong>Type:</strong> {b.brewery_type.charAt(0).toUpperCase() + b.brewery_type.slice(1)}</p>
                <p><strong>Location:</strong> {b.city}, {b.state} {b.postal_code}</p>
                {b.website_url && (
                  <a href={b.website_url} target="_blank" rel="noreferrer">Visit Website</a>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App
