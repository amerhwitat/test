cmake_minimum_required(VERSION 3.21)
project(aurora_native VERSION 0.4 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

enable_testing()

find_package(Qt6 6.6 REQUIRED COMPONENTS Quick WaylandCompositor WaylandClient)

qt_add_executable(aurora_compositor
    main.cpp
)

qt_add_qml_module(aurora_compositor
    URI Aurora
    VERSION 1.0
    QML_FILES
        Aurora.qml
)

target_link_libraries(aurora_compositor PRIVATE
    Qt6::Quick
    Qt6::WaylandCompositor
)

qt_add_executable(aurora_client_probe
    tests/aurora_client_probe.cpp
)

target_link_libraries(aurora_client_probe PRIVATE
    Qt6::WaylandClient
)

add_test(
    NAME aurora_qml_smoke
    COMMAND ${CMAKE_COMMAND}
        -DAURORA_COMPOSITOR=$<TARGET_FILE:aurora_compositor>
        -DAURORA_CLIENT_PROBE=$<TARGET_FILE:aurora_client_probe>
        -P ${CMAKE_CURRENT_SOURCE_DIR}/tests/aurora_qml_smoke.cmake
)

install(TARGETS aurora_compositor aurora_client_probe RUNTIME DESTINATION bin)
