import Link from "next/link";

interface Movie {
    title: string;
    rating: number;
    year: number;
    guid: string;
    posterUrl: string;
    artUrl: string;
    thumbUrl: string;
}

const server = process.env.NEXT_PUBLIC_PLEX_SERVER; // Ensure this env variable is set

async function fetchData() {
    console.log("Fetching data from server", server);
    try {
        const data = await fetch(`${server}/movies`);
        if (!data.ok) {
            throw new Error(`HTTP error! status: ${data.status}`);
        }
        const movies = await data.json();
        //Sorting by rating
        movies.sort((a: any, b: any) => parseFloat(b.rating) - parseFloat(a.rating));
        return movies;
    } catch (error) {
        console.error("Failed to fetch movies:", error);
        // Return an empty array or handle the error gracefully in the UI
        return [];
    }
}

function VideoCard({ movie }: { movie: Movie }) {
    return (
        <Link href={`/watch/${movie.guid}`}>
            <div className="content-card"> {/* Using the unified content-card style */}
                <div className="content-card-image"> {/* Using the unified image container style */}
                    <img className="content-card-img-actual" src={server + "/poster?posterUrl=" + movie.posterUrl} alt={movie.title} /> {/* Using the unified actual image style */}
                </div>
                <div className="content-card-text-area"> {/* New div for title and year */}
                    <h3 className="content-card-title">{movie.title}</h3> {/* Using the unified title style */}
                    <p className="content-card-year">{movie.year}</p> {/* Using the unified year style */}
                </div>
            </div>
        </Link>
    )
}

export default async function Browse() {
    const movies = await fetchData();

    return (
        <div className="app-container"> {/* Consistent app container styling */}
            <h1 className="section-title">Browse All Movies</h1> {/* Consistent section title styling */}
            <div className="content-grid"> {/* Using content-grid for consistent layout */}
                {movies.length > 0 ? (
                    movies.map((movie: Movie) => <VideoCard movie={movie} key={movie.guid} />)
                ) : (
                    <p>No movies found or failed to load movies. Please ensure NEXT_PUBLIC_PLEX_SERVER is configured correctly.</p>
                )}
            </div>
        </div>
    )
}
