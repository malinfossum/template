using System.IO;

namespace MyApp.Services;

public sealed class FileService : IFileService
{
    public string? ReadText(string path)
        => File.Exists(path) ? File.ReadAllText(path) : null;

    public void WriteText(string path, string contents)
    {
        var dir = Path.GetDirectoryName(path);
        if (!string.IsNullOrEmpty(dir))
        {
            Directory.CreateDirectory(dir);
        }

        File.WriteAllText(path, contents);
    }
}
