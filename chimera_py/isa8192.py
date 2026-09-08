from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
import hashlib
from typing import Dict, Iterable

BITS = 8192
LANES = 128
PACKET_SIZE = 16
MASK = (1 << BITS) - 1

_OPCODE_NAMES = '''ADD SUB AND OR XOR NOT SHL SHR ROL ROR MUL MULHI MULMOD MODEXP BARRETT DIV REM CMP CMPEQ CMPLT MOV LOAD STORE PREFETCH MEMCPY MEMSET PIN_PAGES UNPIN_PAGES DMA_MAP DMA_UNMAP DMA_START DMA_WAIT IOMMU_MAP IOMMU_UNMAP GET_FRAME_DESC RELEASE_FRAME XDP_SEND_ZC XDP_RECV_ZC XDP_GET_EVENTFD NETMAP_SEND NETMAP_RECV NIC_REGISTER NIC_UNREGISTER IOCTL IOCTL_RESPOND SYSLOG_WRITE AUDIT_LOG TPM_EXTEND TPM_SEAL TPM_UNSEAL SIGN_VERIFY VERIFY_SIGNATURE LOAD_MODULE UNLOAD_MODULE MODULE_SIGN MODULE_VERIFY KASLR_RESEED RNG_READ RNG_SEED HASH SHA256 SHA512 AESENC AESDEC RSAKEYGEN RSAMOD ECC_POINT_ADD ECC_POINT_MUL RNG_WAIT TRAP SYS_CALL SVC IRQ_ENABLE IRQ_DISABLE CACHE_FLUSH CACHE_INVALIDATE TRACE_START TRACE_STOP DEBUG_BREAK WATCHPOINT_SET WATCHPOINT_CLEAR PERF_EVENT POWER_STATE CLOCK_GET TIMER_SET TIMER_CANCEL CONTEXT_SWITCH TASK_CREATE TASK_EXIT TASK_YIELD TASK_JOIN LOCK_ACQUIRE LOCK_RELEASE RCU_READ_LOCK RCU_READ_UNLOCK RCU_SYNCHRONIZE SLAB_ALLOC SLAB_FREE PAGE_ALLOC PAGE_FREE KMAP KUNMAP USER_COPY_FROM USER_COPY_TO PIN_PAGES_IOCTL MAP_FRAME UNMAP_FRAME RECLAIM_FRAMES GET_EVENTFD NET_POLL NET_CONFIG FS_OPEN FS_READ FS_WRITE FS_CLOSE FS_STAT FS_SYNC VFS_MOUNT VFS_UNMOUNT VFS_LOOKUP VFS_CREATE VFS_REMOVE VFS_RENAME VFS_CHMOD VFS_CHOWN VFS_TRUNCATE VFS_LINK VFS_SYMLINK VFS_READDIR VFS_IOCTL VFS_GETATTR VFS_SETATTR NDB_TABLE_INSERT NDB_TABLE_GET NDB_SNAPSHOT HIVE_SET HIVE_GET HIVE_DELETE HIVE_SNAPSHOT GPU_SUBMIT GPU_WAIT EGL_IMPORT EGL_EXPORT DMABUF_IMPORT DMABUF_EXPORT PIPEWIRE_PUBLISH PIPEWIRE_SUBSCRIBE AUDIO_PLAY AUDIO_STOP VIDEO_ENCODE VIDEO_DECODE GPU_COMPOSITE GPU_BLIT GPU_CLEAR SHADER_COMPILE SHADER_LINK SHADER_BIND SHADER_UNBIND TEXTURE_UPLOAD TEXTURE_DOWNLOAD PBO_MAP PBO_UNMAP PBO_UPLOAD PBO_DOWNLOAD SSAO_PASS TILED_LIGHT_PASS POSTPROCESS_PASS PRESENT_FRAME FRAMEBUFFER_BIND FRAMEBUFFER_UNBIND SWAP_BUFFERS VSYNC_WAIT WP_PRESENT_NOTIFY WP_PRESENT_ACK WP_PRESENT_CANCEL WP_PRESENT_QUERY WP_PRESENT_SET_MODE WP_PRESENT_GET_MODE WP_PRESENT_SET_PRIORITY WP_PRESENT_GET_PRIORITY VIRTIO_INIT VIRTIO_SEND VIRTIO_RECV VIRTIO_SHUTDOWN PCI_PROBE PCI_CONFIG_READ PCI_CONFIG_WRITE PCI_ENABLE_DEVICE PCI_DISABLE_DEVICE PCI_SET_MSI PCI_CLEAR_MSI PCI_MAP_BAR PCI_UNMAP_BAR PCI_DMA_SETUP PCI_DMA_TEARDOWN PMEM_ALLOC PMEM_FREE KERNEL_PANIC REBOOT SHUTDOWN SUSPEND RESUME USER_MODE_ENTER USER_MODE_EXIT PMU_READ PMU_WRITE PERF_SAMPLE TRACE_MARK DEBUG_PRINT USER_YIELD FENCE BARRIER SEV WFE CACHE_LINE_FLUSH CACHE_LINE_INVALIDATE TLB_FLUSH TLB_INVALIDATE PAGE_TABLE_MAP PAGE_TABLE_UNMAP KERNEL_ALLOC KERNEL_FREE USER_ALLOC USER_FREE MAP_IO_REGION UNMAP_IO_REGION IO_PORT_READ IO_PORT_WRITE SMP_SEND_IPI SMP_BROADCAST CPU_FREQ_SET CPU_FREQ_GET THERMAL_QUERY THERMAL_SET_LIMIT LOG_ROTATE CERT_VERIFY KEYSTORE_STORE KEYSTORE_RETRIEVE AUDIT_QUERY LICENSE_CHECK UPDATE_APPLY ROLLBACK HEALTH_CHECK DIAGNOSTIC_RUN METRICS_PUSH ALERT_RAISE ALERT_CLEAR LICENSE_ROTATE SECRETS_ROTATE BACKUP_CREATE BACKUP_RESTORE QUOTA_CHECK QUOTA_ENFORCE SESSION_CREATE SESSION_TERMINATE AUTH_CHALLENGE AUTH_VERIFY POLICY_EVAL POLICY_UPDATE CERT_ROTATE KEY_ROTATE AUDIT_EXPORT CONFIG_GET CONFIG_SET CONFIG_RELOAD LICENSE_QUERY METRICS_QUERY HEARTBEAT CLUSTER_JOIN CLUSTER_LEAVE SERVICE_START SERVICE_STOP SERVICE_RESTART SERVICE_STATUS LOG_LEVEL_SET LOG_LEVEL_GET DIAG_UPLOAD DIAG_DOWNLOAD MAINT_MODE_ENTER MAINT_MODE_EXIT SEC_SCAN_START SEC_SCAN_STOP SEC_SCAN_REPORT POLICY_AUDIT'''.split()
OPCODES: Dict[str, int] = {name: i + 1 for i, name in enumerate(_OPCODE_NAMES)}
NAMES: Dict[int, str] = {v: k for k, v in OPCODES.items()}

_PRIVILEGED = {'MULMOD','MODEXP','BARRETT','PIN_PAGES','UNPIN_PAGES','DMA_MAP','DMA_UNMAP','DMA_START','DMA_WAIT','IOMMU_MAP','IOMMU_UNMAP','NIC_REGISTER','NIC_UNREGISTER','IOCTL_RESPOND','SYSLOG_WRITE','AUDIT_LOG','TPM_EXTEND','TPM_SEAL','TPM_UNSEAL','SIGN_VERIFY','VERIFY_SIGNATURE','LOAD_MODULE','UNLOAD_MODULE','MODULE_SIGN','MODULE_VERIFY','KASLR_RESEED','RNG_SEED','RSAKEYGEN','RSAMOD','ECC_POINT_ADD','ECC_POINT_MUL','TRAP','SVC','IRQ_ENABLE','IRQ_DISABLE','CACHE_FLUSH','CACHE_INVALIDATE','TRACE_START','TRACE_STOP','DEBUG_BREAK','WATCHPOINT_SET','WATCHPOINT_CLEAR','POWER_STATE','CONTEXT_SWITCH','LOCK_ACQUIRE','LOCK_RELEASE','RCU_SYNCHRONIZE','SLAB_ALLOC','SLAB_FREE','PAGE_ALLOC','PAGE_FREE','KMAP','KUNMAP','PIN_PAGES_IOCTL','MAP_FRAME','UNMAP_FRAME','RECLAIM_FRAMES','NET_CONFIG','VFS_MOUNT','VFS_UNMOUNT','VFS_IOCTL','VFS_SETATTR','GPU_SUBMIT','GPU_WAIT','SHADER_COMPILE','SHADER_LINK','SHADER_BIND','SHADER_UNBIND','PBO_MAP','PBO_UNMAP','WP_PRESENT_SET_MODE','WP_PRESENT_SET_PRIORITY','PCI_CONFIG_WRITE','PCI_ENABLE_DEVICE','PCI_DISABLE_DEVICE','PCI_SET_MSI','PCI_CLEAR_MSI','PCI_MAP_BAR','PCI_UNMAP_BAR','PCI_DMA_SETUP','PCI_DMA_TEARDOWN','KERNEL_PANIC','REBOOT','SHUTDOWN','SUSPEND','RESUME','USER_MODE_ENTER','USER_MODE_EXIT','PMU_WRITE','TLB_FLUSH','TLB_INVALIDATE','PAGE_TABLE_MAP','PAGE_TABLE_UNMAP','KERNEL_ALLOC','KERNEL_FREE','MAP_IO_REGION','UNMAP_IO_REGION','IO_PORT_WRITE','SMP_SEND_IPI','SMP_BROADCAST','CPU_FREQ_SET','THERMAL_SET_LIMIT','KEYSTORE_STORE','UPDATE_APPLY','ROLLBACK','LICENSE_ROTATE','SECRETS_ROTATE','BACKUP_RESTORE','QUOTA_ENFORCE','POLICY_EVAL','POLICY_UPDATE','CERT_ROTATE','MAINT_MODE_ENTER','MAINT_MODE_EXIT','SEC_SCAN_START','SEC_SCAN_STOP','SEC_SCAN_REPORT'}

class ExecuteStatus(str, Enum):
    EXECUTED = 'Executed'
    PRIVILEGE_VIOLATION = 'PrivilegeViolation'
    INVALID_OPCODE = 'InvalidOpcode'
    UNIMPLEMENTED_SERVICE = 'UnimplementedService'

@dataclass(frozen=True)
class Instruction:
    opcode: int
    dst: int
    src_a: int
    src_b: int
    imm: int = 0

    @property
    def mnemonic(self) -> str:
        return NAMES.get(self.opcode, '')

    def encode(self) -> bytes:
        return (self.opcode.to_bytes(2,'little') + self.dst.to_bytes(2,'little') + self.src_a.to_bytes(2,'little') + self.src_b.to_bytes(2,'little') + (self.imm & ((1<<64)-1)).to_bytes(8,'little'))

    @classmethod
    def decode(cls, data: bytes) -> 'Instruction':
        if len(data) < PACKET_SIZE:
            raise ValueError('canonical Chimera-II instruction requires 16 bytes')
        return cls(int.from_bytes(data[0:2],'little'), int.from_bytes(data[2:4],'little'), int.from_bytes(data[4:6],'little'), int.from_bytes(data[6:8],'little'), int.from_bytes(data[8:16],'little'))

@dataclass
class CPU8192:
    gpr_count: int = 1024
    pc: int = 0
    flags: int = 0
    privileged: bool = False

    def __post_init__(self) -> None:
        if self.gpr_count < 8:
            raise ValueError('gpr_count must be at least 8')
        self.gpr = [0] * self.gpr_count
        self.halted = False
        self.instructions = 0

    def read(self, index: int) -> int:
        if not 0 <= index < self.gpr_count: raise IndexError('register index out of range')
        return self.gpr[index]

    def write(self, index: int, value: int) -> None:
        if not 0 <= index < self.gpr_count: raise IndexError('register index out of range')
        self.gpr[index] = value & MASK

    @staticmethod
    def lane(value: int, index: int) -> int:
        if not 0 <= index < LANES: raise IndexError('lane index out of range')
        return (value >> (index * 64)) & ((1<<64)-1)

    @staticmethod
    def from_lanes(values: Iterable[int]) -> int:
        result = 0
        for i, value in enumerate(values):
            if i >= LANES: break
            result |= (value & ((1<<64)-1)) << (i*64)
        return result & MASK

    @staticmethod
    def shift_left(value: int, amount: int) -> int: return ((value & MASK) << (amount % 8192)) & MASK
    @staticmethod
    def shift_right(value: int, amount: int) -> int: return (value & MASK) >> (amount % 8192)
    @staticmethod
    def rotate_left(value: int, amount: int) -> int:
        amount %= 8192
        return ((value << amount) | (value >> (8192-amount))) & MASK if amount else value & MASK
    @staticmethod
    def rotate_right(value: int, amount: int) -> int:
        amount %= 8192
        return ((value >> amount) | (value << (8192-amount))) & MASK if amount else value & MASK

    def execute(self, ins: Instruction, memory: bytearray | None = None) -> ExecuteStatus:
        if ins.opcode not in NAMES: return ExecuteStatus.INVALID_OPCODE
        name = ins.mnemonic
        if name in _PRIVILEGED and not self.privileged: return ExecuteStatus.PRIVILEGE_VIOLATION
        a, b = self.read(ins.src_a), self.read(ins.src_b)
        if name == 'ADD': self.write(ins.dst,a+b)
        elif name == 'SUB': self.write(ins.dst,a-b)
        elif name == 'AND': self.write(ins.dst,a&b)
        elif name == 'OR': self.write(ins.dst,a|b)
        elif name == 'XOR': self.write(ins.dst,a^b)
        elif name == 'NOT': self.write(ins.dst,(~a)&MASK)
        elif name == 'SHL': self.write(ins.dst,self.shift_left(a,ins.imm))
        elif name == 'SHR': self.write(ins.dst,self.shift_right(a,ins.imm))
        elif name == 'ROL': self.write(ins.dst,self.rotate_left(a,ins.imm))
        elif name == 'ROR': self.write(ins.dst,self.rotate_right(a,ins.imm))
        elif name == 'MUL': self.write(ins.dst,a*b)
        elif name == 'MULHI': self.write(ins.dst, self.from_lanes(((self.lane(a,k)*self.lane(b,k))>>64 for k in range(LANES))))
        elif name == 'MULMOD': self.write(ins.dst,(a*b) % (self.read(ins.imm & 0x3ff) or 1))
        elif name == 'MODEXP': self.write(ins.dst,pow(a,b,ins.imm or MASK))
        elif name == 'BARRETT': self.write(ins.dst,a % (b or 1))
        elif name == 'DIV':
            if b == 0: return ExecuteStatus.UNIMPLEMENTED_SERVICE
            self.write(ins.dst,a//b)
        elif name == 'REM':
            if b == 0: return ExecuteStatus.UNIMPLEMENTED_SERVICE
            self.write(ins.dst,a%b)
        elif name == 'CMP': self.flags=(1 if a==b else 0)|(2 if a<b else 0)
        elif name == 'CMPEQ': self.flags=1 if a==b else 0
        elif name == 'CMPLT': self.flags=1 if a<b else 0
        elif name == 'MOV': self.write(ins.dst,a)
        elif name in {'LOAD','STORE','MEMCPY','MEMSET'}:
            if memory is None: return ExecuteStatus.UNIMPLEMENTED_SERVICE
            self._memory_op(name,ins,memory)
        elif name == 'SHA256': self.write(ins.dst,int.from_bytes(hashlib.sha256(a.to_bytes(1024,'little')).digest(),'little'))
        elif name == 'SHA512': self.write(ins.dst,int.from_bytes(hashlib.sha512(a.to_bytes(1024,'little')).digest(),'little'))
        elif name in {'TRAP','SYS_CALL','SVC','FENCE','BARRIER','USER_YIELD','DEBUG_PRINT'}: pass
        else: return ExecuteStatus.UNIMPLEMENTED_SERVICE
        self.instructions += 1
        return ExecuteStatus.EXECUTED

    def _memory_op(self, name: str, ins: Instruction, memory: bytearray) -> None:
        addr = ins.imm % len(memory)
        if name == 'LOAD':
            data = memory[addr:addr+1024]
            self.write(ins.dst,int.from_bytes(data.ljust(1024,b'\0'),'little'))
        elif name == 'STORE':
            data=self.read(ins.src_a).to_bytes(1024,'little')
            size=min(1024,max(1,(ins.imm>>48) or 1024))
            memory[addr:addr+size]=data[:size]
        elif name == 'MEMCPY':
            src=self.read(ins.src_a)%len(memory); size=min(len(memory)-addr,ins.imm&0xffff,len(memory)-src)
            memory[addr:addr+size]=memory[src:src+size]
        elif name == 'MEMSET':
            size=min(len(memory)-addr,ins.imm&0xffff); memory[addr:addr+size]=bytes([self.read(ins.src_a)&0xff])*size

class ISA:
    opcodes = OPCODES
    @staticmethod
    def assemble(mnemonic: str, dst: int=0, src_a: int=0, src_b: int=0, imm: int=0) -> bytes:
        opcode=OPCODES.get(mnemonic.upper())
        if opcode is None: raise ValueError('unknown mnemonic: '+mnemonic)
        return Instruction(opcode,dst,src_a,src_b,imm).encode()
    @staticmethod
    def disassemble(data: bytes) -> Instruction:
        ins=Instruction.decode(data)
        if ins.opcode not in NAMES: raise ValueError(f'unknown opcode 0x{ins.opcode:04X}')
        return ins
    @staticmethod
    def round_trip(data: bytes) -> bool: return ISA.disassemble(ISA.disassemble(data).encode()).encode() == data[:16]
    @staticmethod
    def bitmask(start: int, width: int) -> int:
        if start < 0 or width < 1 or start + width > 128: raise ValueError('invalid 128-bit field')
        return ((1<<width)-1)<<start
    @staticmethod
    def opcode_name(opcode: int) -> str: return NAMES.get(opcode,'')
