import unittest

from chimera_py import CPU8192, ChimeraABI, ChimeraCore, ISA, Instruction, OPCODES, ExecuteStatus
from chimera_py.assembler import assemble_text, disassemble


class ChimeraPythonPortTests(unittest.TestCase):
    def test_opcode_catalog_has_canonical_range(self):
        self.assertEqual(len(OPCODES), 284)
        self.assertEqual(OPCODES['ADD'], 0x0001)
        self.assertEqual(OPCODES['POLICY_AUDIT'], 0x011C)

    def test_canonical_packet_layout(self):
        packet = ISA.assemble('ADD', 1, 2, 3, 0x1122334455667788)
        self.assertEqual(len(packet), 16)
        decoded = Instruction.decode(packet)
        self.assertEqual(decoded.opcode, 1)
        self.assertEqual(decoded.dst, 1)
        self.assertEqual(decoded.src_a, 2)
        self.assertEqual(decoded.src_b, 3)
        self.assertEqual(decoded.imm, 0x1122334455667788)
        self.assertTrue(ISA.round_trip(packet))

    def test_8192_bit_arithmetic(self):
        cpu = CPU8192()
        cpu.write(1, (1 << 8191) - 1)
        cpu.write(2, 2)
        status = cpu.execute(Instruction(OPCODES['ADD'], 0, 1, 2))
        self.assertIs(status, ExecuteStatus.EXECUTED)
        self.assertEqual(cpu.read(0), ((1 << 8191) - 1 + 2) & ((1 << 8192) - 1))

    def test_privilege_boundary(self):
        cpu = CPU8192()
        status = cpu.execute(Instruction(OPCODES['DMA_START'], 0, 0, 0))
        self.assertIs(status, ExecuteStatus.PRIVILEGE_VIOLATION)
        cpu.privileged = True
        self.assertIs(cpu.execute(Instruction(OPCODES['DMA_START'], 0, 0, 0)), ExecuteStatus.UNIMPLEMENTED_SERVICE)

    def test_legacy_c_api_shape(self):
        abi = ChimeraABI(2, 4)
        self.assertEqual(abi.chimera_step(), 0)
        state = abi.chimera_state_json()
        self.assertIn('register_bits', state)
        self.assertIn('brain', state)

    def test_scheduler_and_brain(self):
        core = ChimeraCore(cpu_count=2, node_count=4)
        core.step()
        core.step()
        self.assertEqual(core.ticks, 2)
        self.assertGreaterEqual(sum(core.brain.activity), 2)

    def test_assembly_text(self):
        code = assemble_text('MOV R1,R0\nADD R2,R1,R1\n')
        self.assertEqual(len(code), 32)
        self.assertEqual(disassemble(code)[0].split()[0], 'MOV')


if __name__ == '__main__':
    unittest.main()
