using App.Core.Dtos;
using App.Core.Interfaces;
using App.Core.Models;

namespace App.Core.Services;

public class NoteService(INoteRepository repository, TimeProvider time)
{
    public async Task<List<NoteDto>> GetAllAsync() =>
        (await repository.GetAllAsync()).Select(ToDto).ToList();

    public async Task<NoteDto?> GetAsync(int id) =>
        await repository.GetAsync(id) is { } note ? ToDto(note) : null;

    public async Task<NoteDto> CreateAsync(CreateNoteDto dto)
    {
        var now = time.GetUtcNow().UtcDateTime;
        var note = new Note { Title = dto.Title, Body = dto.Body ?? "", CreatedAt = now, UpdatedAt = now };
        await repository.AddAsync(note);
        return ToDto(note);
    }

    public async Task<NoteDto?> UpdateAsync(int id, UpdateNoteDto dto)
    {
        var note = await repository.GetAsync(id);
        if (note is null) return null;
        note.Title = dto.Title;
        note.Body = dto.Body ?? "";
        note.UpdatedAt = time.GetUtcNow().UtcDateTime;
        await repository.UpdateAsync(note);
        return ToDto(note);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var note = await repository.GetAsync(id);
        if (note is null) return false;
        await repository.DeleteAsync(note);
        return true;
    }

    private static NoteDto ToDto(Note n) => new(n.Id, n.Title, n.Body, n.CreatedAt, n.UpdatedAt);
}
