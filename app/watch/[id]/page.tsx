import styles from './page.module.css'

async function fetchVideo(id: string) {
    const res = await fetch(`http://127.0.0.1:5000/movies/${id}`)
    return await res.json()
}

export default async function Watch({params}: any) {
    const video = await fetchVideo(params.id);
    const url = "http://" + video.host + "/stream?video=" + video.location;
    return (
        <div>
            <h1 className="header">Watch</h1>
            <div className={styles.container}>
                <video id={"video-player"} className={styles.video} src={url}  controls autoPlay={true} />
            </div>
        </div>
    )
}