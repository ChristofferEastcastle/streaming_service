export default async function Home() {
  return (
      <div className="app-container">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-overlay"></div>
          <h2 className="hero-title">
            Discover Your Next Obsession
          </h2>
          <p className="hero-description">
            Stream thousands of movies and TV shows, hand-picked for you.
          </p>
          <button className="hero-button">
            Start Browsing
          </button>
        </section>

        {/* Trending Now Section (Placeholder) */}
        <section className="mb-16">
          <h3 className="section-title">Trending Now</h3>
          <div className="content-grid">
            {/* Placeholder Content Cards */}
            {[...Array(10)].map((_, i) => (
                <div key={i} className="content-card">
                  <div className="content-card-image">
                    <img src={`https://placehold.co/150x225/C4DFE6/31473A?text=Content+${i + 1}`} alt={`Placeholder ${i + 1}`} className="content-card-img-actual"/>
                  </div>
                  <div className="content-card-info">
                    <h4 className="content-card-title">Placeholder Title {i + 1}</h4>
                    <p className="content-card-year">2023</p>
                  </div>
                </div>
            ))}
          </div>
        </section>

        {/* New Releases Section (Placeholder) */}
        <section>
          <h3 className="section-title">New Releases</h3>
          <div className="content-grid">
            {/* Placeholder Content Cards */}
            {[...Array(10)].map((_, i) => (
                <div key={i} className="content-card">
                  <div className="content-card-image">
                    <img src={`https://placehold.co/150x225/C4DFE6/31473A?text=Content+${i + 1}`} alt={`Placeholder ${i + 1}`} className="content-card-img-actual"/>
                  </div>
                  <div className="content-card-info">
                    <h4 className="content-card-title">Placeholder Title {i + 1}</h4>
                    <p className="content-card-year">2024</p>
                  </div>
                </div>
            ))}
          </div>
        </section>
      </div>
  )
}
