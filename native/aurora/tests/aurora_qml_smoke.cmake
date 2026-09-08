if(NOT DEFINED AURORA_COMPOSITOR OR NOT DEFINED AURORA_CLIENT_PROBE)
    message(FATAL_ERROR "AURORA_COMPOSITOR and AURORA_CLIENT_PROBE are required")
endif()

set(runtime_dir "${CMAKE_CURRENT_BINARY_DIR}/aurora-runtime")
file(REMOVE_RECURSE "${runtime_dir}")
file(MAKE_DIRECTORY "${runtime_dir}")
file(CHMOD "${runtime_dir}" FILE_PERMISSIONS OWNER_READ OWNER_WRITE OWNER_EXECUTE)

set(log_file "${CMAKE_CURRENT_BINARY_DIR}/aurora-compositor.log")

execute_process(
    COMMAND sh -c "set -eu; export XDG_RUNTIME_DIR='${runtime_dir}'; export WAYLAND_DISPLAY=aurora-0; export QT_QPA_PLATFORM=xcb; '${AURORA_COMPOSITOR}' >'${log_file}' 2>&1 & pid=$!; trap 'kill $pid 2>/dev/null || true; wait $pid 2>/dev/null || true; rm -rf \"${runtime_dir}\"' EXIT; for i in $(seq 1 80); do if test -S \"${runtime_dir}/aurora-0\"; then break; fi; sleep 0.1; done; test -S \"${runtime_dir}/aurora-0\"; '${AURORA_CLIENT_PROBE}'"
    RESULT_VARIABLE result
    OUTPUT_VARIABLE output
    ERROR_VARIABLE error
    TIMEOUT 20
)

if(NOT result EQUAL 0)
    message(STATUS "Aurora compositor output:\n${output}")
    message(STATUS "Aurora compositor error:\n${error}")
    if(EXISTS "${log_file}")
        file(READ "${log_file}" compositor_log)
        message(STATUS "Aurora compositor log:\n${compositor_log}")
    endif()
    message(FATAL_ERROR "Aurora nested Wayland smoke test failed with exit code ${result}")
endif()

message(STATUS "Aurora nested Wayland compositor and client probe passed")
