import QtQuick
import QtQuick.Window
import QtWayland.Compositor
import QtWayland.Compositor.XdgShell

WaylandCompositor {
    id: compositor
    socketName: "aurora-0"

    XdgShell {
        onToplevelCreated: function(toplevel, xdgSurface) {
            const item = chrome.createObject(defaultOutput.surfaceArea, {
                shellSurface: xdgSurface
            })
            if (item)
                item.surface.activated.connect(item.raise)
        }
    }

    WaylandOutput {
        id: output
        sizeFollowsWindow: true
        window: compositorWindow
    }

    Component {
        id: chrome

        ShellSurfaceItem {
            id: surfaceItem
            property bool focused: false

            focus: true
            opacity: focused ? 1.0 : 0.96
            moveItem: surfaceItem
            autoCreatePopupItems: true

            Behavior on x {
                NumberAnimation { duration: 180; easing.type: Easing.OutCubic }
            }
            Behavior on y {
                NumberAnimation { duration: 180; easing.type: Easing.OutCubic }
            }
            Behavior on opacity {
                NumberAnimation { duration: 120 }
            }

            function raise() {
                focused = true
                z = 1
            }

            Component.onCompleted: raise()
        }
    }

    Window {
        id: compositorWindow
        visible: true
        title: "Aurora Wayland"
        width: 1920
        height: 1080
        color: "#07101d"
        flags: Qt.FramelessWindowHint
    }
}
