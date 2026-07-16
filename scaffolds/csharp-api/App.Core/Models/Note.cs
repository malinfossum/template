namespace App.Core.Models;

public class Note
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string Body { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
