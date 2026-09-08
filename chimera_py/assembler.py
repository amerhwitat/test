from __future__ import annotations
import re
from typing import Iterable, List
from .isa8192 import Instruction, NAMES, OPCODES

_REG=re.compile(r'^(?:R|Z)(\d+)$',re.I)

def parse_register(token:str)->int:
    m=_REG.match(token.strip())
    if not m: raise ValueError(f'invalid register: {token}')
    value=int(m.group(1));
    if not 0<=value<=1023: raise ValueError('register must be R0..R1023')
    return value

def parse_int(token:str)->int: return int(token.strip(),0)

def parse_instruction(line:str)->Instruction:
    line=line.split('#',1)[0].split(';',1)[0].strip()
    if not line: raise ValueError('empty instruction')
    parts=re.split(r'[\s,]+',line); mnemonic=parts[0].upper(); args=parts[1:]
    if mnemonic not in OPCODES: raise ValueError(f'unknown mnemonic: {mnemonic}')
    vals=[0,0,0,0]
    for i,arg in enumerate(args[:4]): vals[i]=parse_register(arg) if _REG.match(arg) else parse_int(arg)
    return Instruction(OPCODES[mnemonic],vals[0],vals[1],vals[2],vals[3])

def assemble(lines:Iterable[str])->bytes:
    out=bytearray()
    for line in lines:
        text=line.strip()
        if not text or text.startswith(('#',';')) or text.endswith(':'): continue
        out.extend(parse_instruction(text).encode())
    return bytes(out)

def assemble_text(text:str)->bytes: return assemble(text.splitlines())

def disassemble(code:bytes)->List[str]:
    if len(code)%16: raise ValueError('code length must be a multiple of 16 bytes')
    result=[]
    for off in range(0,len(code),16):
        ins=Instruction.decode(code[off:off+16]); name=NAMES.get(ins.opcode,f'OP_{ins.opcode:04X}')
        result.append(f'{name} R{ins.dst}, R{ins.src_a}, R{ins.src_b}, {ins.imm}')
    return result
