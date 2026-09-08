#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QWaylandCompositor>
#include <QWaylandSeat>
#include <QWaylandXdgShell>

int main(int argc, char **argv) {
    QGuiApplication app(argc, argv);
    QWaylandCompositor compositor;
    QWaylandSeat seat(&compositor);
    seat.setHasPointer(true);
    seat.setHasKeyboard(true);
    seat.setHasTouch(true);
    QWaylandXdgShell xdgShell(&compositor);
    compositor.create();

    QQmlApplicationEngine engine;
    engine.loadFromModule("Aurora", "Shell");
    if (engine.rootObjects().isEmpty()) return 1;
    return app.exec();
}
