"use client"
import styles from './page.module.css'

async function fetchVideo(id: string) {
    const res = await fetch(`http://server.home:5000/movies/${id}`)
    return await res.json()
}

export default async function Watch({ params }: any) {

    const video = await fetchVideo(params.id);
    const url = "http://server.home:5000/stream?video=";
    return (
        <div>
            <h1 className="header">Watch</h1>
            <div className={styles.container}>
                <video
                    id={"video-player"}
                    className={styles.video}
                    controls
                    autoPlay={true}
                    onError={(e) => console.error("ERROR: can not play the video. unsupported format.", e)}
                    controlsList={"nodownload"}
                >
                    {video.locations.map((location: string) => <source key={url + location} src={url + location} />)}

                </video>
            </div>
        </div>
    )
}
