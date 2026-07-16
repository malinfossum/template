# csharp-api Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `scaffolds/csharp-api/` — a copy-once ASP.NET Core Web API starter with layered API + repository shape, per `docs/specs/2026-07-16-csharp-api-scaffold.md` (stress-tested; §4 decision table is binding).

**Architecture:** Four projects — `App.Api` (controllers, DI wiring) → `App.Core` (entities, DTOs, service, repository interface; zero references) ← `App.Data` (EF Core + SQLite, repository implementation), with `App.Tests` (xUnit) covering the service against a hand-rolled fake and the full HTTP pipeline via `WebApplicationFactory`.

**Tech Stack:** .NET 10 (SDK pinned 10.0.300), ASP.NET Core controllers, EF Core + SQLite, xUnit, `Microsoft.AspNetCore.Mvc.Testing`. No other packages.

## Global Constraints

- Branch: all work on `csharp-api-scaffold`, cut from current `main`. Commit after every task (plain imperative messages; **no Co-Authored-By / AI attribution — ever**).
- SDK pin: `global.json` with `"version": "10.0.300", "rollForward": "latestFeature"` — copy from `scaffolds/csharp-layered/global.json`.
- Placeholder naming is `App.*` everywhere; namespaces match folder (`App.Core.Models` etc.).
- No packages beyond: `Microsoft.EntityFrameworkCore.Sqlite` (App.Data), `Microsoft.EntityFrameworkCore.Design` + `Microsoft.AspNetCore.OpenApi` (App.Api), `xunit`* + `Microsoft.AspNetCore.Mvc.Testing` (App.Tests), local tool `dotnet-ef`. If you think you need Moq/FluentAssertions/AutoMapper — you don't; the spec forbids them.
- `App.Core.csproj` must end with **zero** `<PackageReference>` and **zero** `<ProjectReference>` entries (spec §8; DataAnnotations comes from the shared framework).
- The app never calls `EnsureCreated()`; only tests do. The app's schema story is migrations, run by the consumer (spec §6).
- All `dotnet` commands in this plan run from `scaffolds/csharp-api/` unless stated otherwise.
- Workbench-level tests (`node --test tools/*.test.mjs`) and `node tools/check-links.mjs` must stay green; CI has no dotnet SDK, so `tools/csharp-api.test.mjs` (Task 6) must only read files, never invoke `dotnet`.

---

### Task 1: Solution skeleton — four projects that build

**Files:**
- Create: `scaffolds/csharp-api/App.slnx`, `global.json`, `.editorconfig`, `.gitignore`, `.gitattributes`, `.config/dotnet-tools.json`
- Create (via `dotnet new`): `App.Api/`, `App.Core/`, `App.Data/`, `App.Tests/` with project references wired

**Interfaces:**
- Consumes: nothing (first task)
- Produces: a building solution. Reference graph: `App.Api → App.Core + App.Data`; `App.Data → App.Core`; `App.Tests → App.Core + App.Data + App.Api`.

- [ ] **Step 1: Branch**

```bash
git checkout -b csharp-api-scaffold
```

- [ ] **Step 2: Generate projects**

```bash
mkdir -p scaffolds/csharp-api && cd scaffolds/csharp-api
cp ../csharp-layered/global.json ../csharp-layered/.editorconfig ../csharp-layered/.gitattributes .
dotnet new webapi -n App.Api --use-controllers
dotnet new classlib -n App.Core
dotnet new classlib -n App.Data
dotnet new xunit -n App.Tests
rm App.Core/Class1.cs App.Data/Class1.cs App.Tests/UnitTest1.cs
rm App.Api/Controllers/WeatherForecastController.cs App.Api/WeatherForecast.cs
dotnet new tool-manifest
dotnet tool install dotnet-ef
```

(If the webapi template emitted no `Controllers/` sample, skip those `rm` lines — template output varies by SDK feature band.)

- [ ] **Step 3: Wire references and packages**

```bash
dotnet add App.Data reference App.Core
dotnet add App.Api reference App.Core App.Data
dotnet add App.Tests reference App.Core App.Data App.Api
dotnet add App.Data package Microsoft.EntityFrameworkCore.Sqlite
dotnet add App.Api package Microsoft.EntityFrameworkCore.Design
dotnet add App.Tests package Microsoft.AspNetCore.Mvc.Testing
```

- [ ] **Step 4: Write `App.slnx`** (same format as `scaffolds/csharp-layered/App.slnx` — check it and mirror; expected shape):

```xml
<Solution>
  <Project Path="App.Api/App.Api.csproj" />
  <Project Path="App.Core/App.Core.csproj" />
  <Project Path="App.Data/App.Data.csproj" />
  <Project Path="App.Tests/App.Tests.csproj" />
</Solution>
```

- [ ] **Step 5: Write `.gitignore`** — copy `scaffolds/csharp-layered/.gitignore`, then append:

```gitignore
# SQLite database — real data must never be committed (spec §6)
app.db
*.db
```

- [ ] **Step 6: Verify the skeleton builds and Core is clean**

Run: `dotnet build && dotnet test`
Expected: build succeeds; test run reports 0 tests, exit 0.
Run: `grep -c "PackageReference\|ProjectReference" App.Core/App.Core.csproj`
Expected: `0`

- [ ] **Step 7: Commit**

```bash
git add scaffolds/csharp-api && git commit -m "Add csharp-api solution skeleton: four projects, SDK pin, dotnet-ef manifest"
```

---

### Task 2: Domain, DTOs, and NoteService (TDD)

**Files:**
- Create: `App.Core/Models/Note.cs`, `App.Core/Dtos/NoteDtos.cs`, `App.Core/Interfaces/INoteRepository.cs`, `App.Core/Services/NoteService.cs`
- Test: `App.Tests/Unit/FakeNoteRepository.cs`, `App.Tests/Unit/FixedTimeProvider.cs`, `App.Tests/Unit/NoteServiceTests.cs`

**Interfaces:**
- Consumes: Task 1's project graph.
- Produces (later tasks depend on these exact signatures):
  - `Note` — `int Id`, `string Title`, `string Body`, `DateTime CreatedAt`, `DateTime UpdatedAt`
  - `INoteRepository` — `Task<List<Note>> GetAllAsync()`, `Task<Note?> GetAsync(int id)`, `Task AddAsync(Note note)`, `Task UpdateAsync(Note note)`, `Task DeleteAsync(Note note)`
  - `NoteService(INoteRepository repository, TimeProvider time)` — `Task<List<NoteDto>> GetAllAsync()`, `Task<NoteDto?> GetAsync(int id)`, `Task<NoteDto> CreateAsync(CreateNoteDto dto)`, `Task<NoteDto?> UpdateAsync(int id, UpdateNoteDto dto)`, `Task<bool> DeleteAsync(int id)`
  - Records: `NoteDto(int Id, string Title, string Body, DateTime CreatedAt, DateTime UpdatedAt)`, `CreateNoteDto(string Title, string? Body)`, `UpdateNoteDto(string Title, string? Body)`

- [ ] **Step 1: Write the contracts** (`Note.cs`, `NoteDtos.cs`, `INoteRepository.cs` — tests can't compile without them):

```csharp
// App.Core/Models/Note.cs
namespace App.Core.Models;

public class Note
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string Body { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

```csharp
// App.Core/Dtos/NoteDtos.cs
using System.ComponentModel.DataAnnotations;

namespace App.Core.Dtos;

public record NoteDto(int Id, string Title, string Body, DateTime CreatedAt, DateTime UpdatedAt);

public record CreateNoteDto(
    [property: Required][property: MaxLength(200)] string Title,
    [property: MaxLength(4000)] string? Body);

public record UpdateNoteDto(
    [property: Required][property: MaxLength(200)] string Title,
    [property: MaxLength(4000)] string? Body);
```

```csharp
// App.Core/Interfaces/INoteRepository.cs
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
```

- [ ] **Step 2: Write the test doubles and failing tests**

```csharp
// App.Tests/Unit/FakeNoteRepository.cs
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
```

```csharp
// App.Tests/Unit/FixedTimeProvider.cs
namespace App.Tests.Unit;

// Hand-rolled instead of Microsoft.Extensions.TimeProvider.Testing — no extra package (spec §3).
public class FixedTimeProvider(DateTimeOffset start) : TimeProvider
{
    public DateTimeOffset Now { get; set; } = start;
    public override DateTimeOffset GetUtcNow() => Now;
}
```

```csharp
// App.Tests/Unit/NoteServiceTests.cs
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `dotnet test`
Expected: FAIL — compile error, `NoteService` does not exist.

- [ ] **Step 4: Implement `NoteService`**

```csharp
// App.Core/Services/NoteService.cs
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `dotnet test`
Expected: PASS — 8 tests green.

- [ ] **Step 6: Commit**

```bash
git add scaffolds/csharp-api && git commit -m "Add Note domain, DTOs, and NoteService with unit tests"
```

---

### Task 3: Data layer — AppDbContext and NoteRepository (TDD)

**Files:**
- Create: `App.Data/AppDbContext.cs`, `App.Data/Repositories/NoteRepository.cs`
- Test: `App.Tests/Integration/NoteRepositoryTests.cs`

**Interfaces:**
- Consumes: `Note`, `INoteRepository` from Task 2.
- Produces: `AppDbContext(DbContextOptions<AppDbContext> options)` with `DbSet<Note> Notes`; `NoteRepository(AppDbContext db) : INoteRepository`. Task 4's factory reuses this task's in-memory-connection pattern.

- [ ] **Step 1: Write the failing repository tests**

```csharp
// App.Tests/Integration/NoteRepositoryTests.cs
using App.Core.Models;
using App.Data;
using App.Data.Repositories;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace App.Tests.Integration;

// Real SQLite on an in-memory connection: the connection must stay open for the
// database to live, and EnsureCreated builds the schema (tests only — the app migrates).
public sealed class NoteRepositoryTests : IDisposable
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private readonly AppDbContext _db;
    private readonly NoteRepository _repo;

    public NoteRepositoryTests()
    {
        _connection.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_connection).Options;
        _db = new AppDbContext(options);
        _db.Database.EnsureCreated();
        _repo = new NoteRepository(_db);
    }

    public void Dispose() { _db.Dispose(); _connection.Dispose(); }

    private static Note Sample(string title = "First") => new()
    {
        Title = title, Body = "hello",
        CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
    };

    [Fact]
    public async Task Add_then_get_round_trips_through_sqlite()
    {
        var note = Sample();
        await _repo.AddAsync(note);
        var fetched = await _repo.GetAsync(note.Id);
        Assert.NotNull(fetched);
        Assert.Equal("First", fetched.Title);
    }

    [Fact]
    public async Task GetAll_returns_notes_ordered_by_id()
    {
        await _repo.AddAsync(Sample("A"));
        await _repo.AddAsync(Sample("B"));
        var all = await _repo.GetAllAsync();
        Assert.Equal(["A", "B"], all.Select(n => n.Title));
    }

    [Fact]
    public async Task Delete_removes_the_row()
    {
        var note = Sample();
        await _repo.AddAsync(note);
        await _repo.DeleteAsync(note);
        Assert.Null(await _repo.GetAsync(note.Id));
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test`
Expected: FAIL — compile error, `AppDbContext` does not exist.

- [ ] **Step 3: Implement context and repository**

```csharp
// App.Data/AppDbContext.cs
using App.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace App.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Note> Notes => Set<Note>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Note>(note =>
        {
            note.Property(n => n.Title).HasMaxLength(200);
            note.Property(n => n.Body).HasMaxLength(4000);
        });
    }
}
```

```csharp
// App.Data/Repositories/NoteRepository.cs
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test`
Expected: PASS — 11 tests green (8 unit + 3 repository).

- [ ] **Step 5: Commit**

```bash
git add scaffolds/csharp-api && git commit -m "Add AppDbContext and NoteRepository with SQLite in-memory tests"
```

---

### Task 4: API host — controller, Program.cs, end-to-end tests (TDD)

**Files:**
- Create: `App.Tests/Integration/ApiFactory.cs`, `App.Tests/Integration/NotesApiTests.cs`, `App.Api/Controllers/NotesController.cs`, `App.Api/App.Api.http`
- Modify: `App.Api/Program.cs` (replace template content), `App.Api/appsettings.json`, `App.Api/Properties/launchSettings.json`

**Interfaces:**
- Consumes: `NoteService`, DTOs (Task 2); `AppDbContext`, `NoteRepository` (Task 3).
- Produces: routes `GET|POST /api/notes`, `GET|PUT|DELETE /api/notes/{id}`; `Program` visible to tests via `public partial class Program {}`; HTTP on `http://localhost:5005`.

- [ ] **Step 1: Write the failing end-to-end tests**

```csharp
// App.Tests/Integration/ApiFactory.cs
using App.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace App.Tests.Integration;

// Swaps the file-backed SQLite for a shared in-memory connection and creates the
// schema with EnsureCreated — tests only; the app itself must always use migrations.
public class ApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        _connection.Open();
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options => options.UseSqlite(_connection));
            using var scope = services.BuildServiceProvider().CreateScope();
            scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.EnsureCreated();
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        _connection.Dispose();
    }
}
```

```csharp
// App.Tests/Integration/NotesApiTests.cs
using System.Net;
using System.Net.Http.Json;
using App.Core.Dtos;

namespace App.Tests.Integration;

public class NotesApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Post_then_get_round_trips()
    {
        var response = await _client.PostAsJsonAsync("/api/notes", new { title = "First", body = "hello" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<NoteDto>();
        Assert.NotNull(created);

        var fetched = await _client.GetFromJsonAsync<NoteDto>($"/api/notes/{created.Id}");
        Assert.NotNull(fetched);
        Assert.Equal("First", fetched.Title);
        Assert.Equal("hello", fetched.Body);
    }

    [Fact]
    public async Task Post_without_title_returns_problem_details_400()
    {
        var response = await _client.PostAsJsonAsync("/api/notes", new { body = "no title" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("application/problem+json", response.Content.Headers.ContentType?.ToString());
    }

    [Fact]
    public async Task Get_unknown_id_returns_404()
    {
        var response = await _client.GetAsync("/api/notes/9999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_updates_and_returns_the_note()
    {
        var created = await (await _client.PostAsJsonAsync("/api/notes", new { title = "Old", body = "" }))
            .Content.ReadFromJsonAsync<NoteDto>();
        var response = await _client.PutAsJsonAsync($"/api/notes/{created!.Id}", new { title = "New", body = "b" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<NoteDto>();
        Assert.Equal("New", updated!.Title);
    }

    [Fact]
    public async Task Delete_returns_204_then_get_returns_404()
    {
        var created = await (await _client.PostAsJsonAsync("/api/notes", new { title = "Doomed", body = "" }))
            .Content.ReadFromJsonAsync<NoteDto>();
        var del = await _client.DeleteAsync($"/api/notes/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, del.StatusCode);
        var get = await _client.GetAsync($"/api/notes/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test`
Expected: FAIL — compile error: `Program` inaccessible or `NotesController` missing (the template `Program.cs` has no partial declaration yet).

- [ ] **Step 3: Replace `Program.cs`, add controller, settings, launch profile**

```csharp
// App.Api/Program.cs — reads as a table of contents for the architecture (spec §6)
using App.Core.Interfaces;
using App.Core.Services;
using App.Data;
using App.Data.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")));
builder.Services.AddScoped<INoteRepository, NoteRepository>();
builder.Services.AddScoped<NoteService>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.AddCors(options => options.AddPolicy("dev", policy =>
    policy.SetIsOriginAllowed(origin => new Uri(origin).IsLoopback)
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

app.UseExceptionHandler();
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();          // JSON spec at /openapi/v1.json — dev only
    app.UseCors("dev");        // any localhost origin — dev only (spec §4)
}
app.UseHttpsRedirection();
app.MapControllers();

app.Run();

// Top-level statements make Program internal; this line makes it visible to
// WebApplicationFactory<Program> in App.Tests (spec §6). Do not remove.
public partial class Program { }
```

```csharp
// App.Api/Controllers/NotesController.cs
using App.Core.Dtos;
using App.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace App.Api.Controllers;

[ApiController]
[Route("api/notes")]
public class NotesController(NoteService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<NoteDto>>> GetAll() =>
        await service.GetAllAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<NoteDto>> Get(int id) =>
        await service.GetAsync(id) is { } note ? note : NotFound();

    [HttpPost]
    public async Task<ActionResult<NoteDto>> Create(CreateNoteDto dto)
    {
        var note = await service.CreateAsync(dto);
        return CreatedAtAction(nameof(Get), new { id = note.Id }, note);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<NoteDto>> Update(int id, UpdateNoteDto dto) =>
        await service.UpdateAsync(id, dto) is { } note ? note : NotFound();

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) =>
        await service.DeleteAsync(id) ? NoContent() : NotFound();
}
```

`App.Api/appsettings.json` (replace):

```json
{
  "ConnectionStrings": {
    "Default": "Data Source=app.db"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

`App.Api/Properties/launchSettings.json` (replace — pin the port so `App.Api.http` works verbatim):

```json
{
  "$schema": "https://json.schemastore.org/launchsettings.json",
  "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": false,
      "applicationUrl": "http://localhost:5005",
      "environmentVariables": { "ASPNETCORE_ENVIRONMENT": "Development" }
    }
  }
}
```

`App.Api/App.Api.http`:

```http
@host = http://localhost:5005

### List all notes
GET {{host}}/api/notes

### Create a note
POST {{host}}/api/notes
Content-Type: application/json

{ "title": "First note", "body": "Hello from the scaffold." }

### Get one note
GET {{host}}/api/notes/1

### Update a note
PUT {{host}}/api/notes/1
Content-Type: application/json

{ "title": "Renamed note", "body": "Edited body." }

### Delete a note
DELETE {{host}}/api/notes/1

### Validation error — missing title (expect 400 problem+json)
POST {{host}}/api/notes
Content-Type: application/json

{ "body": "no title" }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test`
Expected: PASS — 16 tests green (8 unit + 3 repository + 5 end-to-end).

- [ ] **Step 5: Commit**

```bash
git add scaffolds/csharp-api && git commit -m "Add NotesController, Program wiring, and end-to-end tests"
```

---

### Task 5: README + first-5-steps rehearsal on a real copy

**Files:**
- Create: `scaffolds/csharp-api/README.md`
- Scratch (not committed): a full copy of the scaffold in the session scratchpad

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces: the README whose commands Task 7's acceptance runs verbatim.

- [ ] **Step 1: Write `README.md`** — same skeleton as `scaffolds/csharp-layered/README.md` (read it first, mirror its tone). Must contain exactly these sections and facts:

```markdown
# csharp-api

C# starter for web APIs. Four projects — controllers, domain, data, tests — wired in the
layered API + repository shape: controller → service → repository → DbContext.

## Folder structure

- `App.Core/` — entities, DTOs, service, repository interface. No packages, no IO, no EF.
- `App.Data/` — EF Core + SQLite: `AppDbContext`, repository implementations, migrations.
- `App.Api/` — controllers and `Program.cs` (DI wiring only). The only project that runs.
- `App.Tests/` — xUnit. Unit tests fake the repository; integration tests boot the real
  pipeline via `WebApplicationFactory` on in-memory SQLite.

## First 5 steps in a new project

1. Copy this folder to wherever the project lives.
2. Rename `App.slnx` and each `App.*` project + folder to `<YourName>.*`
   (find/replace `App.` across files).
3. `dotnet tool restore && dotnet restore && dotnet build && dotnet test`
4. Create the database:
   `dotnet ef migrations add Init --project <YourName>.Data --startup-project <YourName>.Api`
   `dotnet ef database update    --project <YourName>.Data --startup-project <YourName>.Api`
5. `dotnet run --project <YourName>.Api` and send the requests in `<YourName>.Api.http`.

## Where your data lives

`app.db` is created next to the startup project (or wherever you launch from). It is
gitignored (`*.db`) — a database with real data must never be committed. The SQLite
connection string is harmless in `appsettings.json`, but the day a real password arrives
it goes in `dotnet user-secrets`, never in a tracked file.

## Working rules

- Entities never leave the service layer — controllers speak DTOs only.
- `App.Core` has zero package references. If it can't compile without one, something leaked.
- The app never calls `EnsureCreated()`; schema changes are migrations
  (`dotnet ef migrations add <Name>` with the two flags above). Tests may use
  `EnsureCreated` because migration history doesn't matter there.
- Timestamps come from the injected `TimeProvider` — never `DateTime.UtcNow` inline.
- CORS: the `dev` policy allows any localhost origin, Development only. Production origins
  are an explicit decision, not a default.

## Request lifecycle (one POST, end to end)

`POST /api/notes` → `NotesController.Create` binds + validates `CreateNoteDto` (400 on
failure, automatic) → `NoteService.CreateAsync` stamps timestamps and maps DTO ↔ entity →
`NoteRepository.AddAsync` saves via `AppDbContext` → SQLite → `201 Created` with a
`Location` header pointing at `GET /api/notes/{id}`.
```

- [ ] **Step 2: Rehearse the first-5-steps on a throwaway copy** (in the session scratchpad, NOT inside the repo):

```bash
SCRATCH=<scratchpad>/csharp-api-rehearsal
cp -r scaffolds/csharp-api "$SCRATCH" && cd "$SCRATCH"
# step 2 of the README: rename App.* -> Demo.*
grep -rl "App\." --include="*.slnx" --include="*.csproj" --include="*.cs" --include="*.http" --include="*.json" . | xargs sed -i 's/App\./Demo./g'
for d in App.Api App.Core App.Data App.Tests; do mv "$d" "${d/App./Demo.}"; done
for f in Demo.*/App.*.csproj; do mv "$f" "${f/App./Demo.}"; done
mv App.slnx Demo.slnx
# step 3-4 of the README
dotnet tool restore && dotnet restore && dotnet build && dotnet test
dotnet ef migrations add Init --project Demo.Data --startup-project Demo.Api
dotnet ef database update    --project Demo.Data --startup-project Demo.Api
```

Expected: every command exits 0; `dotnet test` reports 16 passed; a `Migrations/` folder appears in `Demo.Data`.

- [ ] **Step 3: Run the API and hit every route**

```bash
cd "$SCRATCH" && dotnet run --project Demo.Api &   # background; wait for "Now listening on: http://localhost:5005"
curl -s -X POST http://localhost:5005/api/notes -H "Content-Type: application/json" -d '{"title":"First","body":"hello"}'
curl -s http://localhost:5005/api/notes
curl -s -X PUT http://localhost:5005/api/notes/1 -H "Content-Type: application/json" -d '{"title":"Renamed","body":"x"}'
curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:5005/api/notes/1   # expect 204
curl -s -o /dev/null -w "%{http_code}" http://localhost:5005/api/notes/1             # expect 404
```

Expected: JSON bodies for the first three; `204` then `404`. Kill the server afterwards.

- [ ] **Step 4: Verify the gitignore holds where the data lands**

```bash
cd "$SCRATCH" && git init -q && git add -A && git status --porcelain | grep -c "\.db"
```

Expected: `0` — no `.db` file staged even though `Demo.Api/app.db` exists on disk. Then delete `$SCRATCH`.

- [ ] **Step 5: Fix anything the rehearsal caught, then commit**

If a README command failed as written, fix the README (or the scaffold), re-run the failed step, and only then:

```bash
git add scaffolds/csharp-api && git commit -m "Add csharp-api README, verified against a renamed rehearsal copy"
```

---

### Task 6: Workbench integration — structural test, dashboard, guide, README row

**Files:**
- Create: `tools/csharp-api.test.mjs`
- Modify: `index.html` (dashboard card), `guide/index.html` (scaffold section), `README.md` (scaffold table row), `tools/dashboard.test.mjs` (key-destinations list), `scaffolds/csharp-layered/README.md` ("Adding an API project later" section)

**Interfaces:**
- Consumes: the finished scaffold from Tasks 1–5.
- Produces: CI coverage — `tools/csharp-api.test.mjs` runs on ubuntu with **no dotnet SDK**, so it must only read files.

- [ ] **Step 1: Write the failing structural test**

```js
// tools/csharp-api.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCAFFOLD = join(ROOT, "scaffolds", "csharp-api");
const read = (p) => readFileSync(join(SCAFFOLD, p), "utf8").replaceAll("\r\n", "\n");

test("scaffold ships every load-bearing file", () => {
  for (const p of [
    "App.slnx", "global.json", ".editorconfig", ".gitignore", ".gitattributes",
    ".config/dotnet-tools.json", "README.md",
    "App.Api/Program.cs", "App.Api/Controllers/NotesController.cs", "App.Api/App.Api.http",
    "App.Core/Models/Note.cs", "App.Core/Dtos/NoteDtos.cs",
    "App.Core/Interfaces/INoteRepository.cs", "App.Core/Services/NoteService.cs",
    "App.Data/AppDbContext.cs", "App.Data/Repositories/NoteRepository.cs",
    "App.Tests/Unit/NoteServiceTests.cs", "App.Tests/Integration/NotesApiTests.cs",
  ]) assert.ok(existsSync(join(SCAFFOLD, p)), `missing ${p}`);
});

test("App.Core stays dependency-free", () => {
  const csproj = read("App.Core/App.Core.csproj");
  assert.doesNotMatch(csproj, /<(Package|Project)Reference/, "App.Core must reference nothing");
});

test("gitignore blocks database files", () => {
  assert.match(read(".gitignore"), /^\*\.db$/m);
});

test("Program stays visible to WebApplicationFactory and never EnsureCreates", () => {
  const program = read("App.Api/Program.cs");
  assert.match(program, /public partial class Program \{ \}/);
  assert.doesNotMatch(program, /EnsureCreated/);
});

test("README pins the exact EF commands with both flags", () => {
  const readme = read("README.md");
  assert.match(readme, /--project <YourName>\.Data --startup-project <YourName>\.Api/);
  assert.match(readme, /user-secrets/);
});

test("SDK pin matches csharp-layered", () => {
  const ours = JSON.parse(read("global.json"));
  const theirs = JSON.parse(readFileSync(join(ROOT, "scaffolds", "csharp-layered", "global.json"), "utf8"));
  assert.deepEqual(ours.sdk, theirs.sdk);
});

test("dashboard and guide surface the scaffold", () => {
  const dashboard = readFileSync(join(ROOT, "index.html"), "utf8");
  const guide = readFileSync(join(ROOT, "guide", "index.html"), "utf8");
  assert.ok(dashboard.includes('guide/#csharp-api'), "dashboard card missing");
  assert.ok(guide.includes('id="csharp-api"'), "guide section missing");
});
```

- [ ] **Step 2: Run it to verify only the dashboard/guide test fails**

Run: `node --test tools/csharp-api.test.mjs`
Expected: 6 pass, 1 fail (`dashboard and guide surface the scaffold`) — the scaffold files exist from Tasks 1–5; the workbench surfaces don't yet. If any scaffold-file test fails, fix the scaffold before continuing.

- [ ] **Step 3: Add the dashboard card** — in `index.html`, directly after the `csharp-wpf` card (search `guide/#csharp-wpf`, insert after its closing `</a>`):

```html
					<a class="wb-card" href="./guide/#csharp-api">
						<strong>csharp-api</strong>
						<p>ASP.NET Core Web API — controllers, EF Core + SQLite, xUnit, layered API + repository shape.</p>
						<span class="wb-cue">Get started</span>
					</a>
```

- [ ] **Step 4: Add the guide section** — in `guide/index.html`, after the `csharp-layered` section (`</section>` before `id="csharp-wpf"`), mirroring the house markup:

```html
			<section class="wb-section" id="csharp-api" aria-labelledby="h-api">
				<p class="wb-kicker">Scaffold · C# · Web API</p>
				<h2 id="h-api">csharp-api</h2>
				<p>
					An ASP.NET Core Web API in the layered API + repository shape:
					controllers → service (<code>App.Core</code>, no IO) → repository →
					EF Core + SQLite. xUnit tests cover the service with a hand-rolled fake
					and the full HTTP pipeline via <code>WebApplicationFactory</code>.
				</p>
				<ol>
					<li>Copy <code>scaffolds/csharp-api/</code> to wherever the project lives.</li>
					<li>Rename <code>App.slnx</code> and each <code>App.*</code> project + folder to <code>&lt;YourName&gt;.*</code> (find/replace <code>App.</code> across files).</li>
					<li><code>dotnet tool restore &amp;&amp; dotnet restore &amp;&amp; dotnet build &amp;&amp; dotnet test</code></li>
					<li>Create the database: <code>dotnet ef migrations add Init --project &lt;YourName&gt;.Data --startup-project &lt;YourName&gt;.Api</code>, then <code>dotnet ef database update</code> with the same flags.</li>
					<li><code>dotnet run --project &lt;YourName&gt;.Api</code> and send the requests in <code>&lt;YourName&gt;.Api.http</code>.</li>
				</ol>
				<a class="wb-ghlink" href="https://github.com/malinfossum/workbench/tree/main/scaffolds/csharp-api">View csharp-api on GitHub →</a>
			</section>
```

- [ ] **Step 5: Update workbench `README.md`** — add to the "Pick a scaffold" table after the csharp-wpf row:

```markdown
| [`scaffolds/csharp-api/`](./scaffolds/csharp-api) | ASP.NET Core Web API — layered API + repository, EF Core + SQLite, xUnit | `dotnet build` |
```

- [ ] **Step 6: Point csharp-layered's "Adding an API project later" at the scaffold** — in `scaffolds/csharp-layered/README.md`, replace the body of that section (keep the heading) with:

```markdown
When a project outgrows the console, don't bolt an API on — start the next one from
[`scaffolds/csharp-api/`](../csharp-api), which ships this same layering with controllers,
EF Core + SQLite, and xUnit already wired.
```

- [ ] **Step 7: Extend `tools/dashboard.test.mjs`** — add `"guide/#csharp-api"` to the key-destinations array in the `dashboard links the key destinations` test.

- [ ] **Step 8: Run the full workbench suite**

Run: `node --test tools/*.test.mjs && node tools/check-links.mjs`
Expected: all tests pass (46 existing + 7 new), link check OK.

- [ ] **Step 9: Commit**

```bash
git add tools/csharp-api.test.mjs tools/dashboard.test.mjs index.html guide/index.html README.md scaffolds/csharp-layered/README.md
git commit -m "Surface csharp-api on dashboard, guide, and README with structural tests"
```

---

### Task 7: Acceptance sweep against spec §8

**Files:**
- Modify: nothing new — this task verifies. Fixes discovered here are committed with a message naming what broke.

**Interfaces:**
- Consumes: the whole branch.
- Produces: a branch ready for Malin's review gate.

- [ ] **Step 1: Fresh-copy check (spec §8 line 1)** — `git clone` the repo into the scratchpad at this branch, then in `scaffolds/csharp-api/`: `dotnet restore && dotnet build && dotnet test`. Expected: green, 16 tests, zero edits, zero committed migrations (`ls App.Data/Migrations` must fail — the folder must not exist in git).
- [ ] **Step 2: First-5-steps check (§8 line 2)** — already rehearsed in Task 5; re-run only if anything in the scaffold changed since (Task 6 touched no scaffold code — a docs-only diff means skip, and say so).
- [ ] **Step 3: Core purity check (§8 line 3)** — `grep -E "<(Package|Project)Reference" App.Core/App.Core.csproj` returns nothing (also covered by `tools/csharp-api.test.mjs` in CI forever).
- [ ] **Step 4: Test-floor check (§8 line 4)** — confirm the suite names cover: service not-found edges (`Get_unknown_id_returns_null`, `Update_unknown_id_returns_null`, `Delete_unknown_id_returns_false`), validation (`Post_without_title_returns_problem_details_400`), POST→GET round-trip (`Post_then_get_round_trips`).
- [ ] **Step 5: Database-untracked check (§8 line 5)** — done in Task 5 Step 4 on the rehearsal copy; confirm `.gitignore` still contains `app.db` and `*.db`.
- [ ] **Step 6: Workbench surfaces check (§8 line 6)** — `node --test tools/*.test.mjs && node tools/check-links.mjs` green.
- [ ] **Step 7: Whole-branch review** — dispatch a fresh-context reviewer (superpowers:requesting-code-review) over `git diff main...csharp-api-scaffold` against the spec. Fix findings, commit each fix separately.
- [ ] **Step 8: Push the branch and stop** — `git push -u origin csharp-api-scaffold`. **Do not merge, do not tag.** Malin's gate: she reviews, then merge to main + tag workbench **v2.4.0** (spec §8 last line) happens on her explicit go, same flow as v2.2.0 and v2.3.0.

---

## Self-review notes (spec → plan coverage)

- Spec §4 CORS → Task 4 `Program.cs` (`dev` policy, `IsLoopback`, Development-only). Timestamps/TimeProvider → Tasks 2 & 4. Controllers → Task 4. SQLite → Tasks 3–4. xUnit → Tasks 2–4. `App.*` naming → Task 1. No committed migrations → Task 7 Step 1 asserts the folder's absence. OpenAPI dev-only → Task 4. DTO records + manual mapping → Task 2. ProblemDetails → Task 4 (wiring + asserted in `Post_without_title_returns_problem_details_400`).
- Spec §6 `partial Program` → Task 4 + guarded in Task 6's structural test. EnsureCreated tests-only → Tasks 3–4 comments + structural test asserts `Program.cs` never mentions it. db location + `*.db` ignore → Tasks 1, 5.
- Spec §7 exact EF flags → Task 5 README + structural test regex. user-secrets note → Task 5 README + structural test. Data-location line → Task 5 README.
- Spec §8 acceptance → Task 7, line by line.
- Deliberately not in this plan (spec §9 accepted trade-offs): concurrency tokens, idempotency, PATCH, prod hardening.
