import java.net.URI;
import java.net.http.*;
import java.util.concurrent.*;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;

/** UTF-8 room chat client with nickname/avatar support; run with Java 17+. */
public final class VoiceConnectChat implements WebSocket.Listener {
  private final String room;
  private final String nickname;
  private final String avatar;
  private final String userGuid = UUID.randomUUID().toString();
  private WebSocket socket;

  VoiceConnectChat(String room, String nickname, String avatar) {
    this.room = room;
    this.nickname = nickname;
    this.avatar = avatar;
  }

  public void onOpen(WebSocket ws) {
    socket = ws;
    ws.request(1);
    ws.sendText("{\"type\":\"join\",\"room\":\"" + escape(room) + "\"}", true);
    ws.sendText("{\"type\":\"profile\",\"userGuid\":\"" + userGuid
        + "\",\"nickname\":\"" + escape(nickname) + "\",\"avatar\":\""
        + avatar + "\",\"saveLocally\":false}", true);
    System.out.println("Connected as " + nickname + ". Type messages; /quit exits.");
  }

  public CompletionStage<?> onText(WebSocket ws, CharSequence data, boolean last) {
    System.out.println(data);
    ws.request(1);
    return null;
  }
  public CompletionStage<?> onClose(WebSocket ws, int status, String reason) { return null; }
  public void onError(WebSocket ws, Throwable error) { error.printStackTrace(); }

  private static String escape(String s) {
    return s.replace("\\", "\\\\").replace("\"", "\\\"")
        .replace("\n", " ").replace("\r", " ");
  }

  private static String loadAvatar(String filename) throws Exception {
    if (filename == null || filename.isBlank()) return "";
    byte[] bytes = Files.readAllBytes(Path.of(filename));
    if (bytes.length == 0 || bytes.length > 36 * 1024)
      throw new IllegalArgumentException("Avatar must be between 1 byte and 36 KiB");
    String lower = filename.toLowerCase(Locale.ROOT);
    String mime = lower.endsWith(".png") ? "image/png"
        : lower.endsWith(".jpg") || lower.endsWith(".jpeg") ? "image/jpeg"
        : lower.endsWith(".webp") ? "image/webp"
        : lower.endsWith(".gif") ? "image/gif" : "";
    if (mime.isEmpty()) throw new IllegalArgumentException("Avatar must be PNG, JPEG, WebP or GIF");
    return "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);
  }

  public static void main(String[] args) throws Exception {
    String url = args.length > 0 ? args[0] : "ws://127.0.0.1:8787/signal";
    String room = args.length > 1 ? args[1] : "open-room-01";
    String nickname = args.length > 2 ? args[2].strip() : "Java user";
    if (nickname.length() > 32) nickname = nickname.substring(0, 32);
    if (nickname.isBlank()) nickname = "Guest";
    String avatar = loadAvatar(args.length > 3 ? args[3] : null);
    var client = HttpClient.newHttpClient();
    var listener = new VoiceConnectChat(room, nickname, avatar);
    client.newWebSocketBuilder().buildAsync(URI.create(url), listener).join();
    var in = new Scanner(System.in, StandardCharsets.UTF_8);
    while (in.hasNextLine()) {
      String line = in.nextLine();
      if (line.equals("/quit")) break;
      listener.socket.sendText("{\"type\":\"chat\",\"text\":\"" + escape(line) + "\"}", true);
    }
    listener.socket.sendText("{\"type\":\"leave\"}", true).join();
    listener.socket.sendClose(WebSocket.NORMAL_CLOSURE, "bye").join();
  }
}
