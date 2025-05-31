"use client"
import styles from './page.module.css'

const server = process.env.NEXT_PUBLIC_PLEX_SERVER;
async function fetchVideo(id: string) {
  const res = await fetch(`${server}/movies/${id}`)

  return await res.json()
}

export default async function Watch({ params }: any) {
    const video = await fetchVideo(params.id);
    const url = `${server}/stream?video=`;

    return (
        <div className={"video-page-container"}>
            <h1 className="section-title">{video.title || "Watch"}</h1>
            <div className="video-container">
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
