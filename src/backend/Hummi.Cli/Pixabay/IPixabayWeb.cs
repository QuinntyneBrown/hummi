namespace Hummi.Cli.Pixabay;

/// <summary>Port to Pixabay: a page as text or a file as bytes, null when it cannot be fetched (ADR 0021).</summary>
public interface IPixabayWeb
{
    Task<string?> GetPageAsync(Uri url, CancellationToken cancellationToken = default);

    Task<byte[]?> GetFileAsync(Uri url, CancellationToken cancellationToken = default);
}

/// <summary>Fetches from pixabay.com over HTTPS; a failed status or connection reads as "could not be fetched".</summary>
public sealed class HttpPixabayWeb(HttpClient http) : IPixabayWeb
{
    public const string UserAgent = "Hummi/1.0 (catalogue import; +https://github.com/QuinntyneBrown/hummi)";

    public async Task<string?> GetPageAsync(Uri url, CancellationToken cancellationToken = default)
    {
        try
        {
            using var response = await http.GetAsync(url, cancellationToken);
            return response.IsSuccessStatusCode ? await response.Content.ReadAsStringAsync(cancellationToken) : null;
        }
        catch (HttpRequestException)
        {
            return null;
        }
    }

    public async Task<byte[]?> GetFileAsync(Uri url, CancellationToken cancellationToken = default)
    {
        try
        {
            using var response = await http.GetAsync(url, cancellationToken);
            return response.IsSuccessStatusCode ? await response.Content.ReadAsByteArrayAsync(cancellationToken) : null;
        }
        catch (HttpRequestException)
        {
            return null;
        }
    }

    /// <summary>The client the CLI uses: a browser-like Accept header, the tool's user agent and a 60-second timeout.</summary>
    public static HttpClient CreateClient()
    {
        var client = new HttpClient { Timeout = TimeSpan.FromSeconds(60) };
        client.DefaultRequestHeaders.UserAgent.ParseAdd(UserAgent);
        client.DefaultRequestHeaders.Accept.ParseAdd("text/html,application/xhtml+xml,*/*;q=0.8");
        return client;
    }
}
