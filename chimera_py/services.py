from __future__ import annotations
from dataclasses import dataclass,field
import hashlib
from typing import Dict, Optional

@dataclass
class DMAChannel:
    channel:int; active:bool=False; source:int=0; destination:int=0; length:int=0

@dataclass
class DMAEngine:
    memory:bytearray
    channels:Dict[int,DMAChannel]=field(default_factory=dict)
    def start(self,channel:int,source:int,destination:int,length:int)->None:
        if min(source,destination,length)<0 or source+length>len(self.memory) or destination+length>len(self.memory): raise ValueError('DMA range outside memory')
        self.channels[channel]=DMAChannel(channel,True,source,destination,length)
        self.memory[destination:destination+length]=self.memory[source:source+length]; self.channels[channel].active=False
    def wait(self,channel:int)->bool: return not self.channels.get(channel,DMAChannel(channel)).active

@dataclass
class NetworkBridge:
    rx:bytearray=field(default_factory=bytearray); tx:bytearray=field(default_factory=bytearray)
    def inject(self,packet:bytes)->None: self.rx.extend(packet)
    def receive(self,length:int=1500)->bytes:
        data=bytes(self.rx[:length]); del self.rx[:length]; return data
    def send(self,packet:bytes)->int: self.tx.extend(packet); return len(packet)

@dataclass
class NBitRuntime:
    bits:int=8192
    def mask(self)->int: return (1<<self.bits)-1
    def add(self,a:int,b:int)->int: return (a+b)&self.mask()
    def multiply(self,a:int,b:int)->int: return (a*b)&self.mask()
    def digest(self,value:int,algorithm:str='sha256')->int:
        raw=(value&self.mask()).to_bytes(self.bits//8,'little'); return int.from_bytes(hashlib.new(algorithm,raw).digest(),'little')&self.mask()

@dataclass
class KoreService:
    events:list=field(default_factory=list)
    def publish(self,event:str,payload:Optional[dict]=None)->None: self.events.append({'event':event,'payload':payload or {}})
    def health(self)->dict: return {'status':'ok','events':len(self.events)}
