#!/bin/env python3
import os
import io
from flask import Flask, jsonify, send_file, request, Response
from flask_cors import CORS
from plexapi.server import PlexServer
import requests as req

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
        "locations": list(map(lambda loc: loc.split("/movies")[1], movie.locations))
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
#     movie["host"] = request.host
    movie["host"] = baseurl
    return jsonify(movie)


@app.route("/movies/<id>/subtitles")
def fetch_subtitles(id):
    movies = fetch_movies()
    movie = next(movie for movie in movies if movie["guid"] == id)
    folder = movie_base_url + movie["locations"][0].split("/")[0]
    print(folder)

    for x,y,z in os.walk(folder):
        if ".vtt" in z:
            return z


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

    return Response(stream(), 206, mimetype="video/mp4", headers=headers)


@app.route("/somevideo")
def video():
    return send_file("/home/chris/streaming_service/public/yt.mp4")

@app.route("/poster")
def poster():
    response = req.get(request.args.get("posterUrl"))

    # Get content type from the original response headers, default to octet-stream
    content_type = response.headers.get("Content-Type", "application/octet-stream")

    # Wrap the content in a BytesIO object to make it a file-like object
    return send_file(
        io.BytesIO(response.content),
        mimetype=content_type,
        as_attachment=False  # Set to True if you want the browser to download it
    )



app.run(host="0.0.0.0", debug=True, threaded=True)
