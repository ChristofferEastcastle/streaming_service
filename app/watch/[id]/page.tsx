import styles from './page.module.css'

async function fetchVideo(id: string) {
    // const res = await fetch(`http://cborg.no:5000/movies/${id}`)
    const res = await fetch(`http://localhost:5000/movies/${id}`)
    return await res.json()
}

export default async function Watch({params}: any) {
    const video = await fetchVideo(params.id);
    //const url = "http://" + "cborg.no:5000" + "/stream?video=" + video.location;
    const url = "http://localhost:5000/stream?video=";
    console.log(url);
    return (
        <div>
            <h1 className="header">Watch</h1>
            <div className={styles.container}>
                <video
                    id={"video-player"}
                    className={styles.video}
                    controls
                    autoPlay={true}
                    controlsList={"nodownload"}
                    >
                    {video.locations.map((location: string) => <source src={url + location}/>)}
                    <source src={video.streamURL}/>
                </video>
            </div>
        </div>
    )
}