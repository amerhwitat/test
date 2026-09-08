from __future__ import annotations
from dataclasses import dataclass
import time
from typing import Dict,Optional
from .emulator import ChimeraCore
from .services import DMAEngine,KoreService,NetworkBridge,NBitRuntime

@dataclass
class Task:
    pid:int; name:str; state:str='ready'; priority:int=0
@dataclass
class ChimeraKernel:
    cpu_count:int=8; memory_size:int=1<<20
    def __post_init__(self)->None:
        self.core=ChimeraCore(self.cpu_count,max(32,self.cpu_count*4),self.memory_size);self.dma=DMAEngine(self.core.memory);self.network=NetworkBridge();self.nbit=NBitRuntime(8192);self.kore=KoreService();self.tasks:Dict[int,Task]={};self.next_pid=1;self.booted=False;self.boot_time=0.0
    def boot(self)->None:self.boot_time=time.monotonic();self.booted=True;self.kore.publish('kernel.boot',{'cpus':self.cpu_count,'memory':self.memory_size})
    def create_task(self,name:str,priority:int=0)->int:
        pid=self.next_pid;self.next_pid+=1;self.tasks[pid]=Task(pid,name,'ready',priority);return pid
    def yield_task(self,pid:int)->None:
        if pid in self.tasks:self.tasks[pid].state='ready'
    def exit_task(self,pid:int)->None:
        if pid in self.tasks:self.tasks[pid].state='exited'
    def schedule(self)->Optional[Task]:
        ready=[t for t in self.tasks.values() if t.state=='ready']
        if not ready:return None
        task=max(ready,key=lambda t:t.priority);task.state='running';return task
    def tick(self)->dict:
        status=self.core.step();task=self.schedule()
        if task:task.state='ready'
        return {'status':status.value,'task':task.pid if task else None,'ticks':self.core.ticks}
    def state(self)->dict:return {'booted':self.booted,'uptime':time.monotonic()-self.boot_time if self.booted else 0.0,'tasks':[t.__dict__.copy() for t in self.tasks.values()],'core':self.core.state(),'dma_channels':{str(k):vars(v) for k,v in self.dma.channels.items()},'network':{'rx_bytes':len(self.network.rx),'tx_bytes':len(self.network.tx)},'services':self.kore.health()}
