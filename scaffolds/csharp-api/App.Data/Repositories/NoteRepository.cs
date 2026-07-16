using App.Core.Interfaces;
using App.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace App.Data.Repositories;

public class NoteRepository(AppDbContext db) : INoteRepository
{
    public Task<List<Note>> GetAllAsync() =>
        db.Notes.AsNoTracking().OrderBy(n => n.Id).ToListAsync();

    public Task<Note?> GetAsync(int id) =>
        db.Notes.FirstOrDefaultAsync(n => n.Id == id);

    public async Task AddAsync(Note note)
    {
        db.Notes.Add(note);
        await db.SaveChangesAsync();
    }

    public async Task UpdateAsync(Note note)
    {
        // The entity is tracked (fetched via GetAsync); saving persists its edits.
        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Note note)
    {
        db.Notes.Remove(note);
        await db.SaveChangesAsync();
    }
}
