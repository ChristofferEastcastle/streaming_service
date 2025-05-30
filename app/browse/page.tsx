import styles from './page.module.css'
import Link from "next/link";
import Image from "next/image";

interface Movie {
    title: string;
    rating: number;
    year: number;
    guid: string;
    posterUrl: string;
    artUrl: string;
    thumbUrl: string;
}

const server = process.env.NEXT_PUBLIC_PLEX_SERVER;
async function fetchData() {
    console.log("Fetching data from server", server);
    const data = await fetch(`${server}/movies`);
    const movies = await data.json();
    //Sorting by rating
    movies.sort((a: any, b: any) => parseFloat(b.rating) - parseFloat(a.rating));
    if (!data.ok) {
        throw new Error("HTTP error " + data.status);
    }
    return movies;
}

export default async function Browse() {
    const data = await fetchData();
    console.log(data);
    return (
        <div>
            <h1 className="header">Browse</h1>
            <div className={styles.content}>
                {data.map((movie: Movie) => <VideoCard movie={movie} key={movie.guid} />)}
            </div>
        </div>
    )
}

function VideoCard({ movie }: { movie: Movie }) {
    return (
        <Link href={`/watch/${movie.guid}`}>
            <div className={styles.movieCard}>
                <div className={styles.relative}>
                    <img className={styles.play} src={"play.svg"} alt={"play button"} />
                    <img className={styles.img}  src={server + "/poster?posterUrl=" + movie.posterUrl} alt={movie.title} />
                </div>
                <h3 className={styles.title}>{movie.title}</h3>
                <p className={styles.year}>{movie.year}</p>
            </div>
        </Link>
    )
}
