import QtQuick
import QtWayland.Compositor
import QtWayland.Compositor.XdgShell

WaylandCompositor {
    id: compositor
    socketName: "aurora-0"

    WlCompositor {}
    DataDeviceManager {}
    XdgShell {
        onToplevelCreated: function(toplevel, xdgSurface) {
            const item = chrome.createObject(output.surfaceArea, {
                shellSurface: xdgSurface
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
            width: Math.max(640, shellSurface ? shellSurface.windowGeometry.width : 640)
            height: Math.max(420, shellSurface ? shellSurface.windowGeometry.height : 420)
            x: targetX
            y: targetY
            focus: true
            opacity: focused ? 1.0 : 0.96

            Behavior on x { NumberAnimation { duration: 180; easing.type: Easing.OutCubic } }
            Behavior on y { NumberAnimation { duration: 180; easing.type: Easing.OutCubic } }
            Behavior on opacity { NumberAnimation { duration: 120 } }

            function raise() {
                focused = true
                surfaceItem.z = ++compositor.zCounter
            }
        }
    }

    property int zCounter: 1

    Rectangle {
        id: compositorWindow
        visible: false
        width: 1920
        height: 1080
    }
}
