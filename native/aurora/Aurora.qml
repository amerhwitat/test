import QtQuick
import QtQuick.Window
import QtWayland.Compositor
import QtWayland.Compositor.XdgShell

WaylandCompositor {
    id: compositor
    socketName: "aurora-0"
    property int zCounter: 1

    WlCompositor {}
    DataDeviceManager {}

    XdgShell {
        onToplevelCreated: function(toplevel, xdgSurface) {
            const item = chrome.createObject(output.surfaceArea, {
                shellSurface: xdgSurface,
                windowTitle: toplevel.title
            })
            if (item)
                item.surface.activated.connect(item.raise)
        }
    }

    XdgDecorationManagerV1 {
        preferredMode: XdgToplevel.ServerSideDecoration
    }

    WaylandOutput {
        id: output
        sizeFollowsWindow: true
        window: compositorWindow
        scaleFactor: Math.max(1, Math.round(compositorWindow.devicePixelRatio))
    }

    WaylandSeat {
        id: seat
        capabilities: WaylandSeat.PointerCapability | WaylandSeat.KeyboardCapability
    }

    Component {
        id: chrome

        ShellSurfaceItem {
            id: surfaceItem
            property real targetX: 80
            property real targetY: 80
            property bool focused: false
            property string windowTitle: "Aurora Application"

            width: Math.max(640, shellSurface ? shellSurface.windowGeometry.width : 640)
            height: Math.max(420, shellSurface ? shellSurface.windowGeometry.height : 420)
            x: targetX
            y: targetY
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
                surfaceItem.z = ++compositor.zCounter
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
