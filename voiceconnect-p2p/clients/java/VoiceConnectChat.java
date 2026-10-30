import java.net.URI;
import java.net.http.*;
import java.util.concurrent.*;
import java.util.*;
import java.nio.charset.StandardCharsets;

/** UTF-8 room chat client; run with Java 17+. */
public final class VoiceConnectChat implements WebSocket.Listener {
  private final String room;
  private WebSocket socket;
  VoiceConnectChat(String room) { this.room=room; }
  public void onOpen(WebSocket ws) { socket=ws; ws.request(1); ws.sendText("{\"type\":\"join\",\"room\":\""+escape(room)+"\"}",true); System.out.println("Connected. Type messages; /quit exits."); }
  public CompletionStage<?> onText(WebSocket ws, CharSequence data, boolean last) { System.out.println(data); ws.request(1); return null; }
  public CompletionStage<?> onClose(WebSocket ws,int status,String reason) { return null; }
  public void onError(WebSocket ws,Throwable error) { error.printStackTrace(); }
  private static String escape(String s){return s.replace("\\","\\\\").replace("\"","\\\"");}
  public static void main(String[] args) throws Exception {
    String url=args.length>0?args[0]:"ws://127.0.0.1:8787/signal", room=args.length>1?args[1]:"open-room-01";
    var client=HttpClient.newHttpClient();var listener=new VoiceConnectChat(room);
    client.newWebSocketBuilder().buildAsync(URI.create(url),listener).join();
    var in=new Scanner(System.in,StandardCharsets.UTF_8);
    while(in.hasNextLine()){String line=in.nextLine();if(line.equals("/quit"))break;listener.socket.sendText("{\"type\":\"chat\",\"text\":\""+escape(line)+"\"}",true);}
    listener.socket.sendText("{\"type\":\"leave\"}",true).join();listener.socket.sendClose(WebSocket.NORMAL_CLOSURE,"bye").join();
  }
}
