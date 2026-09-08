#include <wayland-client.h>

#include <cstdio>
#include <cstring>

namespace {
struct RegistryState {
    bool compositor = false;
    bool xdgWmBase = false;
};

void global(void *data, wl_registry *, uint32_t, const char *interface, uint32_t)
{
    auto *state = static_cast<RegistryState *>(data);
    if (std::strcmp(interface, "wl_compositor") == 0)
        state->compositor = true;
    else if (std::strcmp(interface, "xdg_wm_base") == 0)
        state->xdgWmBase = true;
}

void globalRemove(void *, wl_registry *, uint32_t) {}

const wl_registry_listener listener = {
    global,
    globalRemove,
};
}

int main()
{
    wl_display *display = wl_display_connect(nullptr);
    if (!display) {
        std::fprintf(stderr, "Aurora probe: wl_display_connect failed\n");
        return 1;
    }

    RegistryState state;
    wl_registry *registry = wl_display_get_registry(display);
    wl_registry_add_listener(registry, &listener, &state);

    if (wl_display_roundtrip(display) < 0) {
        std::fprintf(stderr, "Aurora probe: registry roundtrip failed\n");
        wl_display_disconnect(display);
        return 2;
    }

    const bool ok = state.compositor && state.xdgWmBase;
    if (!state.compositor)
        std::fprintf(stderr, "Aurora probe: missing wl_compositor\n");
    if (!state.xdgWmBase)
        std::fprintf(stderr, "Aurora probe: missing xdg_wm_base\n");

    wl_display_disconnect(display);
    return ok ? 0 : 3;
}
