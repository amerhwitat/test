package com.amerhwitat.test.mobile
import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.camera2.CameraManager
import androidx.core.content.ContextCompat
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap
data class ChatEvent(val conversationId:String,val senderId:String,val sequence:Long,val text:String,val sha256:String)
object ConversationSync{private val seen=ConcurrentHashMap<String,Long>();fun accept(e:ChatEvent):Boolean{val h=MessageDigest.getInstance("SHA-256").digest(e.text.toByteArray()).joinToString(""){ "%02x".format(it)};if(h!=e.sha256)return false;val k="${e.conversationId}:${e.senderId}";val o=seen[k]?:-1;if(e.sequence<=o)return false;seen[k]=e.sequence;return true}}
data class MediaCapabilities(val microphone:Boolean,val speaker:Boolean,val camera:Boolean){companion object{fun detect(c:Context):MediaCapabilities{val m=ContextCompat.checkSelfPermission(c,Manifest.permission.RECORD_AUDIO)==PackageManager.PERMISSION_GRANTED;val ca=ContextCompat.checkSelfPermission(c,Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED;val cm=c.getSystemService(Context.CAMERA_SERVICE)as CameraManager;val has=try{cm.cameraIdList.isNotEmpty()}catch(_:Exception){false};return MediaCapabilities(m,c.getSystemService(Context.AUDIO_SERVICE)!=null,ca&&has)}}}
interface RealtimeMediaTransport{fun sendAudio(frame:ByteArray);fun sendVideo(frame:ByteArray);fun close()}
