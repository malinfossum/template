using MyApp.ViewModels;

namespace MyApp.Tests;

/// <summary>
/// Tests target ViewModels and Models only — never Views/XAML.
/// </summary>
public class MainViewModelTests
{
    [Fact]
    public void ConfirmWiring_updates_status()
    {
        var vm = new MainViewModel();

        vm.ConfirmWiringCommand.Execute(null);

        Assert.Contains("Command executed", vm.Status);
    }

    [Fact]
    public void Status_raises_change_notification()
    {
        var vm = new MainViewModel();
        var raised = new List<string?>();
        vm.PropertyChanged += (_, e) => raised.Add(e.PropertyName);

        vm.ConfirmWiringCommand.Execute(null);

        Assert.Contains(nameof(vm.Status), raised);
    }
}
