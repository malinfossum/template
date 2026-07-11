using System.Windows;
using MyApp.ViewModels;

namespace MyApp;

/// <summary>
/// Sets the DataContext only — behavior lives in the ViewModel,
/// layout lives in the XAML.
/// </summary>
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        DataContext = new MainViewModel();
    }
}
