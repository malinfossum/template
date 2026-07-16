using App.Core.Interfaces;
using App.Core.Models;

namespace App.Tests.Unit;

public class FakeNoteRepository : INoteRepository
{
    private readonly List<Note> _notes = [];
    private int _nextId = 1;

    public Task<List<Note>> GetAllAsync() => Task.FromResult(_notes.ToList());
    public Task<Note?> GetAsync(int id) => Task.FromResult(_notes.FirstOrDefault(n => n.Id == id));
    public Task AddAsync(Note note) { note.Id = _nextId++; _notes.Add(note); return Task.CompletedTask; }
    public Task UpdateAsync(Note note) => Task.CompletedTask;
    public Task DeleteAsync(Note note) { _notes.Remove(note); return Task.CompletedTask; }
}
