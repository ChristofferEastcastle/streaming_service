import Link from "next/link";
import {fetchData, Movie, VideoCard} from "../browse/page";

function createMovieList(movies: Movie[]) {
  return <>
    {movies.map((movie) => {
      return (
          <div key={movie.guid}>
            <VideoCard movie={movie}/>
          </div>
      );
    })}
  </>;
}

export default async function Home() {
  const movies = await fetchData();

  return (
      <div className="app-container">
        <section className="hero-section">
          <div className="hero-overlay"></div>
          <h2 className="hero-title">
            Discover Your Next Obsession
          </h2>
          <p className="hero-description">
            Stream thousands of movies, hand-picked for you.
          </p>
          <Link href={"/browse"} className="hero-button">
            Browse Movies
          </Link>
        </section>

        <section className="mb-16">
          <h3 className="section-title">Trending Now</h3>
          <div className="content-grid">
            {createMovieList(movies.slice(0, 10))}
          </div>
        </section>

        <section>
          <h3 className="section-title">New Releases</h3>
          <div className="content-grid">
            {createMovieList(movies.sort((a, b) => b.year - a.year).slice(0, 10))}
          </div>
        </section>
      </div>
  )
}
