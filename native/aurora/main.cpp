#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QSurfaceFormat>
#include <QQuickWindow>
#include <cstdlib>

int main(int argc, char **argv)
{
    QGuiApplication app(argc, argv);
    QCoreApplication::setApplicationName("Aurora Wayland Compositor");
    QCoreApplication::setApplicationVersion("0.3");

    // Keep the compositor testable inside another desktop. The production
    // launcher may select a hardware-integrated backend explicitly.
    if (!qEnvironmentVariableIsSet("QT_WAYLAND_HARDWARE_INTEGRATION"))
        qputenv("QT_WAYLAND_HARDWARE_INTEGRATION", "wayland-egl");

    QQmlApplicationEngine engine;
    const QUrl url(QStringLiteral("qrc:/Aurora.qml"));
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreationFailed,
                     &app, [] { QCoreApplication::exit(EXIT_FAILURE); },
                     Qt::QueuedConnection);
    engine.load(url);
    if (engine.rootObjects().isEmpty())
        return EXIT_FAILURE;
    return app.exec();
}
