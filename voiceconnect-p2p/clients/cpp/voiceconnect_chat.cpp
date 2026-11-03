// C++17 UTF-8 room chat client using Boost.Beast (boost-system, OpenSSL).
// Optional arguments: host port room nickname avatar-file
#include <boost/beast/core.hpp>
#include <boost/beast/websocket.hpp>
#include <boost/asio/connect.hpp>
#include <boost/asio/ip/tcp.hpp>
#include <array>
#include <fstream>
#include <iostream>
#include <iterator>
#include <random>
#include <sstream>
#include <iomanip>
#include <thread>
#include <string>
#include <vector>

namespace beast = boost::beast;
namespace websocket = beast::websocket;
namespace net = boost::asio;
using tcp = net::ip::tcp;

static std::string escape_json(const std::string& s) {
  std::string o;
  for (unsigned char c : s) {
    if (c == '"' || c == '\\') o += '\\';
    if (c == '\n' || c == '\r') continue;
    if (c >= 0x20) o += static_cast<char>(c);
  }
  return o;
}

static std::string base64(const std::vector<unsigned char>& in) {
  static const char table[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  std::string out;
  for (std::size_t i = 0; i < in.size(); i += 3) {
    unsigned n = static_cast<unsigned>(in[i]) << 16;
    if (i + 1 < in.size()) n |= static_cast<unsigned>(in[i + 1]) << 8;
    if (i + 2 < in.size()) n |= in[i + 2];
    out += table[(n >> 18) & 63];
    out += table[(n >> 12) & 63];
    out += i + 1 < in.size() ? table[(n >> 6) & 63] : '=';
    out += i + 2 < in.size() ? table[n & 63] : '=';
  }
  return out;
}

static std::string make_guid() {
  std::random_device rd;
  std::array<unsigned char, 16> bytes{};
  for (auto& byte : bytes) byte = static_cast<unsigned char>(rd());
  // RFC 4122 version 4 UUID; the signaling service accepts this canonical form.
  bytes[6] = static_cast<unsigned char>((bytes[6] & 0x0f) | 0x40);
  bytes[8] = static_cast<unsigned char>((bytes[8] & 0x3f) | 0x80);
  std::ostringstream out;
  out << std::hex << std::setfill('0');
  for (std::size_t i = 0; i < bytes.size(); ++i) {
    if (i == 4 || i == 6 || i == 8 || i == 10) out << '-';
    out << std::setw(2) << static_cast<unsigned>(bytes[i]);
  }
  return out.str();
}

static std::string load_avatar(const std::string& filename) {
  if (filename.empty()) return "";
  std::string mime = filename.size() >= 4 && filename.substr(filename.size() - 4) == ".png" ? "image/png"
      : filename.size() >= 4 && filename.substr(filename.size() - 4) == ".jpg" ? "image/jpeg"
      : filename.size() >= 5 && filename.substr(filename.size() - 5) == ".jpeg" ? "image/jpeg"
      : filename.size() >= 5 && filename.substr(filename.size() - 5) == ".webp" ? "image/webp"
      : filename.size() >= 4 && filename.substr(filename.size() - 4) == ".gif" ? "image/gif" : "";
  if (mime.empty()) throw std::runtime_error("Avatar must be PNG, JPEG, WebP or GIF");
  std::ifstream file(filename, std::ios::binary);
  if (!file) throw std::runtime_error("Cannot open avatar file");
  std::vector<unsigned char> bytes((std::istreambuf_iterator<char>(file)), {});
  if (bytes.empty() || bytes.size() > 36 * 1024)
    throw std::runtime_error("Avatar must be between 1 byte and 36 KiB");
  return "data:" + mime + ";base64," + base64(bytes);
}

int main(int argc, char** argv) {
  try {
    std::string host = argc > 1 ? argv[1] : "127.0.0.1";
    std::string port = argc > 2 ? argv[2] : "8787";
    std::string room = argc > 3 ? argv[3] : "open-room-01";
    std::string nickname = argc > 4 ? argv[4] : "C++ user";
    if (nickname.size() > 32) nickname.resize(32);
    if (nickname.empty()) nickname = "Guest";
    std::string avatar = load_avatar(argc > 5 ? argv[5] : "");
    const std::string user_guid = make_guid();

    net::io_context ioc;
    tcp::resolver resolver(ioc);
    websocket::stream<tcp::socket> ws(ioc);
    auto endpoints = resolver.resolve(host, port);
    net::connect(ws.next_layer(), endpoints);
    ws.handshake(host + ":" + port, "/signal");
    ws.write(net::buffer(std::string("{\"type\":\"join\",\"room\":\"") + escape_json(room) + "\"}"));
    ws.write(net::buffer(std::string("{\"type\":\"profile\",\"userGuid\":\"") + user_guid
        + "\",\"nickname\":\"" + escape_json(nickname) + "\",\"avatar\":\"" + avatar
        + "\",\"saveLocally\":false}"));

    std::cout << "Connected as " << nickname << ". Type messages; /quit exits.\n";
    std::thread reader([&] {
      try {
        for (;;) {
          beast::flat_buffer b;
          ws.read(b);
          std::cout << beast::buffers_to_string(b.data()) << std::endl;
        }
      } catch (...) {}
    });
    std::string line;
    while (std::getline(std::cin, line)) {
      if (line == "/quit") break;
      auto msg = std::string("{\"type\":\"chat\",\"text\":\"") + escape_json(line) + "\"}";
      ws.write(net::buffer(msg));
    }
    ws.write(net::buffer(std::string("{\"type\":\"leave\"}")));
    ws.close(websocket::close_code::normal);
    reader.join();
  } catch (const std::exception& e) {
    std::cerr << e.what() << "\n";
    return 1;
  }
  return 0;
}
