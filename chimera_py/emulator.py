from __future__ import annotations
from dataclasses import dataclass,field
import json,threading
from typing import Dict,List,Optional
from .isa8192 import CPU8192,ExecuteStatus,Instruction

@dataclass
class BrainEdge:
    source:int; target:int; packets:int=0
@dataclass
class BrainGraph:
    node_count:int=32; edges:List[BrainEdge]=field(default_factory=list); activity:List[int]=field(default_factory=list)
    def __post_init__(self)->None:self.activity=self.activity or [0]*self.node_count;self.rebuild()
    def rebuild(self)->None:
        self.edges.clear()
        for i in range(self.node_count):
            self.edges.append(BrainEdge(i,(i+1)%self.node_count))
            if self.node_count>2:self.edges.append(BrainEdge(i,(i+2)%self.node_count))
    def activate(self,node:int)->None:
        node%=self.node_count;self.activity[node]+=1
        for edge in self.edges:
            if edge.source==node:edge.packets+=1;break

@dataclass
class ChimeraCore:
    cpu_count:int=8; node_count:int=32; memory_size:int=4096; gpr_count:int=1024
    def __post_init__(self)->None:
        if not 1<=self.cpu_count<=1024:raise ValueError('cpu_count must be in 1..1024')
        self.cpus=[CPU8192(self.gpr_count) for _ in range(self.cpu_count)];self.memory=bytearray(self.memory_size);self.brain=BrainGraph(self.node_count)
        self.ticks=self.messages_sent=self.messages_delivered=self.scheduler_cursor=0;self.run_state='paused';self.lock=threading.RLock()
    def reset(self)->None:
        with self.lock:
            self.cpus=[CPU8192(self.gpr_count) for _ in range(self.cpu_count)];self.memory[:]=b'\0'*len(self.memory);self.brain=BrainGraph(self.node_count);self.ticks=self.messages_sent=self.messages_delivered=self.scheduler_cursor=0;self.run_state='paused'
    def step(self,code:Optional[bytes]=None,privileged:Optional[bool]=None)->ExecuteStatus:
        with self.lock:
            cpu_id=self.scheduler_cursor%self.cpu_count;cpu=self.cpus[cpu_id];status=ExecuteStatus.EXECUTED
            if not cpu.halted:
                if code is None:cpu.pc+=4;cpu.instructions+=1
                elif cpu.pc>=len(code):cpu.halted=True
                else:
                    if privileged is not None:cpu.privileged=privileged
                    ins=Instruction.decode(code[cpu.pc:cpu.pc+16]);status=cpu.execute(ins,self.memory)
                    if status is ExecuteStatus.EXECUTED:cpu.pc+=16
                self.messages_sent+=1;self.messages_delivered+=1;self.brain.activate(cpu_id)
            self.scheduler_cursor=(cpu_id+1)%self.cpu_count;self.ticks+=1;return status
    def load_program(self,code:bytes,cpu:int=0,start:int=0)->None:
        if len(code)%16:raise ValueError('program length must be a multiple of 16 bytes')
        if not 0<=cpu<self.cpu_count:raise IndexError('cpu index out of range')
        if start<0 or start+len(code)>self.memory_size:raise ValueError('program does not fit memory')
        self.memory[start:start+len(code)]=code;self.cpus[cpu].pc=start
    def run(self,code:Optional[bytes]=None,steps:int=1,privileged:bool=False)->List[ExecuteStatus]:
        self.run_state='running';result=[]
        for _ in range(max(0,steps)):
            status=self.step(code,privileged);result.append(status)
            if status in (ExecuteStatus.INVALID_OPCODE,ExecuteStatus.PRIVILEGE_VIOLATION):break
        self.run_state='paused';return result
    def control(self,action:str)->int:
        action=action.lower()
        if action=='start':self.run_state='running';return 0
        if action=='pause':self.run_state='paused';return 0
        if action=='step':self.step();return 0
        if action=='reset':self.reset();return 0
        return -1
    def state(self)->Dict[str,object]:
        with self.lock:return {'ticks':self.ticks,'run_state':self.run_state,'scheduler_cursor':self.scheduler_cursor,'messages_sent':self.messages_sent,'messages_delivered':self.messages_delivered,'memory_bytes':self.memory_size,'register_bits':8192,'gpr_count':self.gpr_count,'cpus':[{'id':i,'pc':c.pc,'instructions':c.instructions,'halted':c.halted,'reg0':f'0x{c.read(0):02048x}'} for i,c in enumerate(self.cpus)],'brain':{'nodes':self.brain.node_count,'activity':self.brain.activity,'edges':[[e.source,e.target,e.packets] for e in self.brain.edges]}}
    def state_json(self)->str:return json.dumps(self.state(),ensure_ascii=False,separators=(',',':'))

class ChimeraABI:
    def __init__(self,cpu_count:int=8,node_count:int=32)->None:self.state=ChimeraCore(cpu_count,node_count,gpr_count=8)
    def chimera_init(self,cpu_count:int,node_count:int)->int:self.state=ChimeraCore(cpu_count,node_count,gpr_count=8);return 0
    def chimera_destroy(self)->None:self.state=None
    def chimera_reset(self)->None:
        if self.state is not None:self.state.reset()
    def chimera_step(self)->int:
        if self.state is None:return -1
        self.state.step();return 0
    def chimera_control(self,action:str)->int:
        if self.state is None:return -1
        return self.state.control(action)
    def chimera_state_json(self)->str:
        if self.state is None:raise RuntimeError('Chimera state is destroyed')
        return self.state.state_json()
