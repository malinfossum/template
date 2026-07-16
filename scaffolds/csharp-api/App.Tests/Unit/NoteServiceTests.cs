using App.Core.Dtos;
using App.Core.Services;

namespace App.Tests.Unit;

public class NoteServiceTests
{
    private static readonly DateTimeOffset T0 = new(2026, 7, 16, 12, 0, 0, TimeSpan.Zero);
    private readonly FakeNoteRepository _repo = new();
    private readonly FixedTimeProvider _time = new(T0);
    private readonly NoteService _service;

    public NoteServiceTests() => _service = new NoteService(_repo, _time);

    [Fact]
    public async Task Create_assigns_id_and_stamps_both_timestamps_from_time_provider()
    {
        var note = await _service.CreateAsync(new CreateNoteDto("First", "hello"));
        Assert.Equal(1, note.Id);
        Assert.Equal(T0.UtcDateTime, note.CreatedAt);
        Assert.Equal(T0.UtcDateTime, note.UpdatedAt);
    }

    [Fact]
    public async Task Create_with_null_body_stores_empty_string()
    {
        var note = await _service.CreateAsync(new CreateNoteDto("First", null));
        Assert.Equal("", note.Body);
    }

    [Fact]
    public async Task Get_unknown_id_returns_null()
    {
        Assert.Null(await _service.GetAsync(999));
    }

    [Fact]
    public async Task Update_moves_UpdatedAt_but_not_CreatedAt()
    {
        var created = await _service.CreateAsync(new CreateNoteDto("First", "hello"));
        _time.Now = T0.AddHours(2);
        var updated = await _service.UpdateAsync(created.Id, new UpdateNoteDto("Renamed", "world"));
        Assert.NotNull(updated);
        Assert.Equal("Renamed", updated.Title);
        Assert.Equal(T0.UtcDateTime, updated.CreatedAt);
        Assert.Equal(T0.AddHours(2).UtcDateTime, updated.UpdatedAt);
    }

    [Fact]
    public async Task Update_unknown_id_returns_null()
    {
        Assert.Null(await _service.UpdateAsync(999, new UpdateNoteDto("x", null)));
    }

    [Fact]
    public async Task Delete_existing_returns_true_and_removes_it()
    {
        var created = await _service.CreateAsync(new CreateNoteDto("First", null));
        Assert.True(await _service.DeleteAsync(created.Id));
        Assert.Null(await _service.GetAsync(created.Id));
    }

    [Fact]
    public async Task Delete_unknown_id_returns_false()
    {
        Assert.False(await _service.DeleteAsync(999));
    }

    [Fact]
    public async Task GetAll_returns_created_notes_in_order()
    {
        await _service.CreateAsync(new CreateNoteDto("A", null));
        await _service.CreateAsync(new CreateNoteDto("B", null));
        var all = await _service.GetAllAsync();
        Assert.Equal(["A", "B"], all.Select(n => n.Title));
    }
}
