import QtQuick
import QtQuick.Window

Window {
    id: root
    objectName: "AuroraShell"
    visible: true
    width: 1440
    height: 900
    title: "Aurora Fluent Glass"
    color: "#08111f"

    property real pointerX: width / 2
    property real pointerY: height / 2

    Rectangle {
        anchors.fill: parent
        color: "#08111f"
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#0b1630" }
            GradientStop { position: 0.55; color: "#111b35" }
            GradientStop { position: 1.0; color: "#090d18" }
        }
    }

    Rectangle {
        width: 520; height: 260
        x: root.pointerX - width / 2
        y: root.pointerY - height / 2
        radius: 28
        opacity: 0.16
        color: "#55b8ff"
        Behavior on x { NumberAnimation { duration: 180; easing.type: Easing.OutCubic } }
        Behavior on y { NumberAnimation { duration: 180; easing.type: Easing.OutCubic } }
    }

    Rectangle {
        id: topbar
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.right: parent.right
        height: 42
        color: "#99142132"
        border.color: "#334f6e"
        Text { anchors.centerIn: parent; text: "AURORA • CHIMERA II"; color: "#dceeff"; font.pixelSize: 14; font.bold: true }
    }

    Rectangle {
        id: dock
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: parent.bottom
        anchors.bottomMargin: 18
        width: 560; height: 66
        radius: 24
        color: "#cc172338"
        border.color: "#44617e"
        Text { anchors.centerIn: parent; text: "◈   ◆   ◉   ▣   ⌕   ⚙"; color: "#eaf5ff"; font.pixelSize: 25 }
    }

    MouseArea {
        anchors.fill: parent
        hoverEnabled: true
        onPositionChanged: function(mouse) {
            root.pointerX = mouse.x
            root.pointerY = mouse.y
        }
    }
}
