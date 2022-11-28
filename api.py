#!/bin/env python3
import os
from flask import Flask, jsonify, send_file, request, Response
from flask_cors import CORS
from plexapi.server import PlexServer

baseurl = os.getenv("PLEX_URL")
token = os.getenv("PLEX_TOKEN")
plex = PlexServer(baseurl, token)


def map_movie(movie):
    return {
        "guid": movie.guid[movie.guid.rindex("/") + 1:],
        "title": movie.title,
        "artUrl": movie.artUrl,
        "posterUrl": movie.posterUrl,
        "thumbUrl": movie.thumbUrl,
        "year": movie.year,
        "rating": movie.rating,
        "streamURL": movie.getStreamURL(),
        "locations": map(lambda loc: loc.split("/movies")[1], movie.locations),
        "test": "test"
    }


movie_base_url = "/home/chris/Documents/movies"


def fetch_movies():
    lib = plex.library.section('movies')
    lib.refresh()
    data = lib.all()
    return [map_movie(movie) for movie in data]


app = Flask(__name__)
CORS(app)


@app.route("/movies")
def movie_data():
    res = jsonify(fetch_movies())
    res.headers.add("Access-Control-Allow-Origin", "*")
    return res


CORS(app)


@app.route("/movies/<id>")
def fetch_movie(id):
    movies = fetch_movies()
    movie = next(movie for movie in movies if movie["guid"] == id)
    movie["host"] = request.host
    return jsonify(movie)

CORS(app)

@app.route("/stream")
def stream():
    video_requested = request.args.get("video")
    range_header = request.headers["range"]
    print(range_header)
    if range_header is None:
        return "not ok"

    start = int(range_header.split("=")[1].split("-")[0])
    chunk_size = 10 ** 6 * 10
    video_size = os.path.getsize(movie_base_url + video_requested)
    end = min(int(start) + int(chunk_size), video_size)
    content_length = end - start + 1
    print(chunk_size, start, end, video_size)

    headers = {
        "Content-Range": f"bytes {start}-{end}/{video_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": content_length,
        "Connection": "keep-alive",
        "Keep-Alive": "timeout=10",
        "Content-Disposition": "inline; filename=" + video_requested[video_requested.rindex("/") + 1:],
        "ETag": "123",
        "Access-Control-Allow-Origin": "*"

    }

    def stream():
        with open(movie_base_url + video_requested, "rb") as f:
            f.seek(start)
            chunk = f.read(content_length)
            yield chunk

    return Response(stream(), 206, headers=headers)


@app.route("/somevideo")
def video():
    return send_file("/home/chris/streaming_service/public/yt.mp4")


app.run(host="0.0.0.0", debug=True, threaded=True)
