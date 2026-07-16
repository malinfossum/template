using App.Core.Models;

namespace App.Core.Interfaces;

public interface INoteRepository
{
    Task<List<Note>> GetAllAsync();
    Task<Note?> GetAsync(int id);
    Task AddAsync(Note note);
    Task UpdateAsync(Note note);
    Task DeleteAsync(Note note);
}
