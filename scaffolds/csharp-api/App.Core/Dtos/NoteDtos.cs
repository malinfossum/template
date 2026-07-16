using System.ComponentModel.DataAnnotations;

namespace App.Core.Dtos;

public record NoteDto(int Id, string Title, string Body, DateTime CreatedAt, DateTime UpdatedAt);

public record CreateNoteDto(
    [property: Required][property: MaxLength(200)] string Title,
    [property: MaxLength(4000)] string? Body);

public record UpdateNoteDto(
    [property: Required][property: MaxLength(200)] string Title,
    [property: MaxLength(4000)] string? Body);
