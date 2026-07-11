using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace MyApp.ViewModels;

/// <summary>
/// [ObservableProperty] generates the Status property (with change
/// notification); [RelayCommand] generates ConfirmWiringCommand from
/// ConfirmWiring(). Replace both with the project's real state and
/// behavior — this pair only proves the binding chain works.
/// </summary>
public partial class MainViewModel : ObservableObject
{
    [ObservableProperty]
    private string _status = "MVVM wired — edit ViewModels/MainViewModel.cs.";

    [RelayCommand]
    private void ConfirmWiring()
    {
        Status = "Command executed — the binding chain works.";
    }
}
