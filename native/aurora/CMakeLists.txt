cmake_minimum_required(VERSION 3.21)
project(aurora_native VERSION 0.3 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

find_package(Qt6 6.6 REQUIRED COMPONENTS Quick WaylandCompositor)

qt_add_executable(aurora_compositor
    main.cpp
)

qt_add_resources(aurora_compositor aurora_qml
    PREFIX "/"
    FILES
        Aurora.qml
)

target_link_libraries(aurora_compositor PRIVATE
    Qt6::Quick
    Qt6::WaylandCompositor
)

install(TARGETS aurora_compositor RUNTIME DESTINATION bin)
