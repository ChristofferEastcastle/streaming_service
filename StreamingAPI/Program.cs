using System.Net.Http.Headers;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin() // Allow requests from any origin for simplicity. In production, restrict this.
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// Configure Plex settings from environment variables or appsettings.json
builder.Configuration.AddEnvironmentVariables();
var plexUrl = builder.Configuration["PLEX_URL"] ?? "http://localhost:32400"; // Default Plex URL
var plexToken = builder.Configuration["PLEX_TOKEN"] ?? "your_plex_token_here"; // Default Plex Token

// Configure the base directory for movies
var movieBaseDirectory = builder.Configuration["MOVIE_BASE_DIRECTORY"] ?? "/home/chris/Documents/movies";

// Register HttpClient for proxying requests (e.g., posters)
builder.Services.AddHttpClient();

// Register the PlexService as a singleton (or scoped, depending on its internal state)
builder.Services.AddSingleton(new PlexService(plexUrl, plexToken, movieBaseDirectory));

// Register the SubtitleService
builder.Services.AddSingleton(new SubtitleService(movieBaseDirectory));

var app = builder.Build();

app.UseCors(); // Enable CORS for all endpoints

// Define Minimal API Endpoints

// GET /movies
app.MapGet("/movies", async (PlexService plexService) =>
{
    var movies = await plexService.GetAllMoviesAsync();
    return Results.Ok(movies);
})
.WithName("GetMovies")
.WithOpenApi();

// GET /movies/{id}
app.MapGet("/movies/{id}", async (string id, PlexService plexService, HttpContext httpContext) =>
{
    var movie = await plexService.GetMovieByIdAsync(id);
    if (movie == null)
    {
        return Results.NotFound($"Movie with ID '{id}' not found.");
    }

    // Create a new MovieDto with the Host property set
    var movieWithHost = movie with { Host = $"{httpContext.Request.Scheme}://{httpContext.Request.Host}" };
    return Results.Ok(movieWithHost);
})
.WithName("GetMovieById")
.WithOpenApi();

// GET /movies/{id}/subtitles
app.MapGet("/movies/{id}/subtitles", async (string id, PlexService plexService, SubtitleService subtitleService) =>
{
    var movie = await plexService.GetMovieByIdAsync(id);
    if (movie == null)
    {
        return Results.NotFound($"Movie with ID '{id}' not found.");
    }

    // Assuming the first location is the primary one for subtitles
    var subtitles = subtitleService.FindSubtitles(movie.Locations.FirstOrDefault() ?? string.Empty);
    return Results.Ok(subtitles);
})
.WithName("GetMovieSubtitles")
.WithOpenApi();

// GET /stream
app.MapGet("/stream", async (HttpContext httpContext, [FromQuery] string video, IConfiguration configuration) =>
{
    var movieBaseDirectory = configuration["MOVIE_BASE_DIRECTORY"] ?? "/home/chris/Documents/movies";
    var filePath = Path.Combine(movieBaseDirectory, video.TrimStart('/'));

    if (!File.Exists(filePath))
    {
        return Results.NotFound($"Video file not found: {filePath}");
    }

    var fileInfo = new FileInfo(filePath);
    var fileSize = fileInfo.Length;
    var rangeHeader = httpContext.Request.Headers.Range.FirstOrDefault();

    // Default chunk size (10 MB)
    long chunkSize = 10 * 1024 * 1024;

    if (string.IsNullOrEmpty(rangeHeader))
    {
        // If no range header, serve the whole file (or first chunk)
        httpContext.Response.StatusCode = 200;
        httpContext.Response.Headers.ContentType = "video/mp4";
        httpContext.Response.Headers.ContentLength = fileSize;
        httpContext.Response.Headers.AcceptRanges = "bytes";

        await using var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        await fileStream.CopyToAsync(httpContext.Response.Body);
        return Results.Empty; // Return empty result as content is streamed directly
    }
    else
    {
        // Handle byte range request
        httpContext.Response.StatusCode = 206; // Partial Content
        httpContext.Response.Headers.ContentType = "video/mp4";
        httpContext.Response.Headers.AcceptRanges = "bytes";

        var range = RangeHeaderValue.Parse(rangeHeader).Ranges.FirstOrDefault();
        if (range == null)
        {
            return Results.BadRequest("Invalid Range header.");
        }

        long start = range.From ?? 0;
        long end = range.To ?? (start + chunkSize - 1); // If 'To' is not specified, use chunk size
        end = Math.Min(end, fileSize - 1); // Ensure end does not exceed file size

        long contentLen = end - start + 1;

        httpContext.Response.Headers.ContentRange = $"bytes {start}-{end}/{fileSize}";
        httpContext.Response.Headers.ContentLength = contentLen;

        await using var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        fileStream.Seek(start, SeekOrigin.Begin);
        await fileStream.CopyToAsync(httpContext.Response.Body, (int)contentLen);
        return Results.Empty; // Return empty result as content is streamed directly
    }
})
.WithName("StreamVideo")
.WithOpenApi();

// GET /poster
app.MapGet("/poster", async (HttpContext httpContext, [FromQuery] string posterUrl, IHttpClientFactory httpClientFactory) =>
{
    if (string.IsNullOrEmpty(posterUrl))
    {
        return Results.BadRequest("posterUrl query parameter is required.");
    }

    var httpClient = httpClientFactory.CreateClient();
    try
    {
        var response = await httpClient.GetAsync(posterUrl, HttpCompletionOption.ResponseHeadersRead);
        response.EnsureSuccessStatusCode(); // Throws an exception if the HTTP response status is an error code.

        // Get content type from the original response headers
        var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";

        // Stream the content directly to the response
        httpContext.Response.StatusCode = (int)response.StatusCode;
        httpContext.Response.Headers.ContentType = contentType;
        httpContext.Response.Headers.ContentLength = response.Content.Headers.ContentLength;

        await response.Content.CopyToAsync(httpContext.Response.Body);
        return Results.Empty; // Content is streamed directly
    }
    catch (HttpRequestException ex)
    {
        app.Logger.LogError(ex, "Error proxying poster image from {PosterUrl}", posterUrl);
        return Results.InternalServerError($"Failed to fetch poster: {ex.Message}"); // Bad Gateway
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "An unexpected error occurred while proxying poster image from {PosterUrl}", posterUrl);
        return Results.InternalServerError($"An unexpected error occurred: {ex.Message}");
    }
})
.WithName("ProxyPoster")
.WithOpenApi();

// GET /somevideo (static file serving example)
app.MapGet("/somevideo", (IConfiguration configuration) =>
{
    var movieBaseDirectory = configuration["MOVIE_BASE_DIRECTORY"] ?? "/home/chris/Documents/movies";
    var filePath = Path.Combine(movieBaseDirectory, "public", "yt.mp4"); // Assuming 'public' subfolder

    if (!File.Exists(filePath))
    {
        return Results.NotFound($"Video file not found: {filePath}");
    }

    // Use File.OpenRead to get a stream and return it as a FileStreamResult
    return Results.Stream(File.OpenRead(filePath), contentType: "video/mp4", enableRangeProcessing: true);
})
.WithName("GetSomeVideo")
.WithOpenApi();


app.Run();

// <summary>
/// Represents the data structure for a movie returned by the API.
/// </summary>
public record MovieDto(
    string Guid,
    string Title,
    string ArtUrl,
    string PosterUrl,
    string ThumbUrl,
    int Year,
    double Rating,
    string StreamURL,
    List<string> Locations,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] // Only include 'Host' when explicitly set
    string? Host = null
);

/// <summary>
/// Service to interact with Plex (mocked for this example).
/// In a real application, this would use a Plex API client or direct HTTP calls.
/// </summary>
public class PlexService
{
    private readonly string _plexUrl;
    private readonly string _plexToken;
    private readonly string _movieBaseDirectory;
    private readonly List<MovieDto> _mockMovies; // Mock data for demonstration

    public PlexService(string plexUrl, string plexToken, string movieBaseDirectory)
    {
        _plexUrl = plexUrl;
        _plexToken = plexToken;
        _movieBaseDirectory = movieBaseDirectory;

        // Initialize mock movie data
        _mockMovies = new List<MovieDto>
        {
            new MovieDto(
                Guid: "12345",
                Title: "The Matrix",
                ArtUrl: $"{_plexUrl}/library/metadata/12345/art/12345",
                PosterUrl: $"{_plexUrl}/library/metadata/12345/thumb/12345",
                ThumbUrl: $"{_plexUrl}/library/metadata/12345/thumb/12345",
                Year: 1999,
                Rating: 8.7,
                StreamURL: "/stream?video=/The Matrix (1999)/The.Matrix.1999.mp4", // Example local path
                Locations: new List<string> { "/The Matrix (1999)/The.Matrix.1999.mp4" }
            ),
            new MovieDto(
                Guid: "67890",
                Title: "Inception",
                ArtUrl: $"{_plexUrl}/library/metadata/67890/art/67890",
                PosterUrl: $"{_plexUrl}/library/metadata/67890/thumb/67890",
                ThumbUrl: $"{_plexUrl}/library/metadata/67890/thumb/67890",
                Year: 2010,
                Rating: 8.8,
                StreamURL: "/stream?video=/Inception (2010)/Inception.2010.mkv", // Example local path
                Locations: new List<string> { "/Inception (2010)/Inception.2010.mkv" }
            )
        };
    }

    /// <summary>
    /// Fetches all movies from the Plex library (mocked).
    /// In a real app, this would call the Plex API.
    /// </summary>
    public async Task<List<MovieDto>> GetAllMoviesAsync()
    {
        // Simulate a network delay
        await Task.Delay(100);
        return _mockMovies;
    }

    /// <summary>
    /// Fetches a single movie by its GUID (mocked).
    /// In a real app, this would call the Plex API.
    /// </summary>
    public async Task<MovieDto?> GetMovieByIdAsync(string id)
    {
        // Simulate a network delay
        await Task.Delay(50);
        return _mockMovies.FirstOrDefault(m => m.Guid == id);
    }
}

/// <summary>
/// Service to handle subtitle file discovery.
/// </summary>
public class SubtitleService
{
    private readonly string _movieBaseDirectory;

    public SubtitleService(string movieBaseDirectory)
    {
        _movieBaseDirectory = movieBaseDirectory;
    }

    /// <summary>
    /// Finds .vtt subtitle files within a movie's directory.
    /// </summary>
    /// <param name="movieLocation">The relative path of the movie file (e.g., "/The Matrix (1999)/The.Matrix.1999.mp4").</param>
    /// <returns>A list of .vtt file names found.</returns>
    public List<string> FindSubtitles(string movieLocation)
    {
        var subtitles = new List<string>();
        try
        {
            // Extract the directory containing the movie file
            var movieDirectory = Path.Combine(_movieBaseDirectory, Path.GetDirectoryName(movieLocation.TrimStart('/')) ?? string.Empty);

            if (Directory.Exists(movieDirectory))
            {
                foreach (var file in Directory.EnumerateFiles(movieDirectory, "*.vtt", SearchOption.AllDirectories))
                {
                    subtitles.Add(Path.GetFileName(file));
                }
            }
            else
            {
                Console.WriteLine($"Directory not found: {movieDirectory}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error finding subtitles: {ex.Message}");
        }
        return subtitles;
    }
}