namespace App.Tests.Unit;

// Hand-rolled instead of Microsoft.Extensions.TimeProvider.Testing — no extra package (spec §3).
public class FixedTimeProvider(DateTimeOffset start) : TimeProvider
{
    public DateTimeOffset Now { get; set; } = start;
    public override DateTimeOffset GetUtcNow() => Now;
}
