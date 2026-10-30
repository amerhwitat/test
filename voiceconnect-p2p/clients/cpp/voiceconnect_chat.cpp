// C++17 UTF-8 room chat client using Boost.Beast (boost-system, OpenSSL).
#include <boost/beast/core.hpp>
#include <boost/beast/websocket.hpp>
#include <boost/asio/connect.hpp>
#include <boost/asio/ip/tcp.hpp>
#include <iostream>
#include <string>
namespace beast=boost::beast; namespace websocket=beast::websocket; namespace net=boost::asio; using tcp=net::ip::tcp;
static std::string escape_json(const std::string&s){std::string o;for(char c:s){if(c=='"'||c=='\\')o+='\\';if((unsigned char)c>=0x20)o+=c;}return o;}
int main(int argc,char**argv){try{
 std::string host=argc>1?argv[1]:"127.0.0.1",port=argc>2?argv[2]:"8787",room=argc>3?argv[3]:"open-room-01";
 net::io_context ioc;tcp::resolver resolver(ioc);websocket::stream<tcp::socket> ws(ioc);
 auto endpoints=resolver.resolve(host,port);net::connect(ws.next_layer(),endpoints);ws.handshake(host+":"+port,"/signal");
 ws.write(net::buffer(std::string("{\"type\":\"join\",\"room\":\"")+escape_json(room)+"\"}"));
 std::cout<<"Connected. Type messages; /quit exits.\n";
 std::thread reader([&]{try{for(;;){beast::flat_buffer b;ws.read(b);std::cout<<beast::buffers_to_string(b.data())<<std::endl;}}catch(...){}});
 std::string line;while(std::getline(std::cin,line)){if(line=="/quit")break;auto msg=std::string("{\"type\":\"chat\",\"text\":\"")+escape_json(line)+"\"}";ws.write(net::buffer(msg));}
 ws.write(net::buffer(std::string("{\"type\":\"leave\"}")));ws.close(websocket::close_code::normal);reader.join();
 }catch(const std::exception&e){std::cerr<<e.what()<<"\n";return 1;}return 0;}
