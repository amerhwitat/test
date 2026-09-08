#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QCoreApplication>
#include <cstdlib>

int main(int argc, char **argv)
{
    QGuiApplication app(argc, argv);
    QCoreApplication::setApplicationName("Aurora Wayland Compositor");
    QCoreApplication::setApplicationVersion("0.4");

    // Keep the compositor testable inside another desktop. The production
    // launcher may select a hardware-integrated backend explicitly.
    if (!qEnvironmentVariableIsSet("QT_WAYLAND_HARDWARE_INTEGRATION"))
        qputenv("QT_WAYLAND_HARDWARE_INTEGRATION", "wayland-egl");

    QQmlApplicationEngine engine;
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreationFailed,
                     &app, [] { QCoreApplication::exit(EXIT_FAILURE); },
                     Qt::QueuedConnection);
    engine.loadFromModule("Aurora", "Aurora");
    if (engine.rootObjects().isEmpty())
        return EXIT_FAILURE;
    return app.exec();
}
