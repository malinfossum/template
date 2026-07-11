using System.Windows;

namespace MyApp;

/// <summary>
/// Composition root. Services are constructed here and handed to
/// ViewModels — ViewModels never do I/O themselves (see Services/).
/// </summary>
public partial class App : Application
{
}
