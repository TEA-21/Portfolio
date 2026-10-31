/**
 * lib/mascot-dialogues.ts
 *
 * 100+ Mega Dialogue Pool & Shuffle-Bag Engine for ARIA Cadet.
 * Covers 7 rich technical and scientific categories:
 *  - AI & Agentic Architectures
 *  - Systems, OS & Hardware Security
 *  - Astrophysics, Cosmology & Quantum Mechanics
 *  - Classic Gaming Physics Lore & Speedrun Exploits
 *  - Famous Mathematical Conjectures & Computing Milestones
 *  - Cult Retro Sci-Fi Lore & Philosophy
 *  - In-Character Space Cadet Humor & Fourth-Wall Shenanigans
 */

export type DialogueCategory =
  | "ai_agentic"
  | "systems_security"
  | "astrophysics_science"
  | "gaming_lore"
  | "math_computing_history"
  | "retro_scifi_lore"
  | "cadet_quips";

export interface DialogueItem {
  id: string;
  category: DialogueCategory;
  categoryLabel: string;
  badgeColor: string;
  text: string;
}

export const MASCOT_DIALOGUES: DialogueItem[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // 1. AI & AGENTIC FRAMEWORKS (16 items)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "ai_1",
    category: "ai_agentic",
    categoryLabel: "AI & AGENTS",
    badgeColor: "#38bdf8",
    text: "Taanush builds multi-agent debate swarms where models critique each other's reasoning trees before committing code!",
  },
  {
    id: "ai_2",
    category: "ai_agentic",
    categoryLabel: "AI & AGENTS",
    badgeColor: "#38bdf8",
    text: "Model Context Protocol (MCP) gives LLMs verifiable hands — calling sandboxed tools instead of guessing answers.",
  },
  {
    id: "ai_3",
    category: "ai_agentic",
    categoryLabel: "AI & AGENTS",
    badgeColor: "#38bdf8",
    text: "Context caching cut token latency by 70% in our agent loops. Long prompts shouldn't mean slow inference!",
  },
  {
    id: "ai_4",
    category: "ai_agentic",
    categoryLabel: "AI & AGENTS",
    badgeColor: "#38bdf8",
    text: "Hallucination isn't magic, it's ungrounded probability. We tether every generation to deterministic schema validations.",
  },
  {
    id: "ai_5",
    category: "ai_agentic",
    categoryLabel: "AI & AGENTS",
    badgeColor: "#38bdf8",
    text: "Reinforcement learning simulations: training autonomous agents to navigate edge cases before they touch production.",
  },
  {
    id: "ai_6",
    category: "ai_agentic",
    categoryLabel: "AI & AGENTS",
    badgeColor: "#38bdf8",
    text: "Speculative decoding uses a nimble draft model to guess tokens ahead, letting the frontier model verify 3x faster in parallel.",
  },
  {
    id: "ai_7",
    category: "ai_agentic",
    categoryLabel: "AI & AGENTS",
    badgeColor: "#38bdf8",
    text: "FlashAttention-3 rewrites the GPU memory hierarchy, swapping HBM transfers for asynchronous Tensor Core matrix multiplies.",
  },
  {
    id: "ai_8",
    category: "ai_agentic",
    categoryLabel: "AI & AGENTS",
    badgeColor: "#38bdf8",
    text: "RAG is not just a vector search — real-world retrieval requires hybrid BM25 lexical ranking, semantic re-ranking, and Reciprocal Rank Fusion.",
  },
  {
    id: "ai_9",
    category: "ai_agentic",
    categoryLabel: "AI & AGENTS",
    badgeColor: "#38bdf8",
    text: "Mixture-of-Experts (MoE) activates only 2 of 8 expert neural layers per token. Maximum parameter capacity, minimal compute footprint!",
  },
  {
    id: "ai_10",
    category: "ai_agentic",
    categoryLabel: "AI & AGENTS",
    badgeColor: "#38bdf8",
    text: "Chain-of-Thought reasoning works because autoregressive transformers use output scratchpads to compute intermediate attention representations.",
  },
  {
    id: "ai_11",
    category: "ai_agentic",
    categoryLabel: "AI & AGENTS",
    badgeColor: "#38bdf8",
    text: "Quantizing weights from FP16 down to INT4 cuts VRAM by 75% with under 1% perplexity loss when using activation-aware AWQ algorithms.",
  },
  {
    id: "ai_12",
    category: "ai_agentic",
    categoryLabel: "AI & AGENTS",
    badgeColor: "#38bdf8",
    text: "Direct Preference Optimization (DPO) derives an implicit reward function straight from human pairwise preferences, skipping complex PPO reward models.",
  },
  {
    id: "ai_13",
    category: "ai_agentic",
    categoryLabel: "AI & AGENTS",
    badgeColor: "#38bdf8",
    text: "Prompt injection defenses must assume untrusted inputs are adversarial payloads. Never concatenate user strings directly into system instructions!",
  },
  {
    id: "ai_14",
    category: "ai_agentic",
    categoryLabel: "AI & AGENTS",
    badgeColor: "#38bdf8",
    text: "Rotary Position Embeddings (RoPE) represent token distances as rotational complex angles, enabling clean length extrapolation beyond training windows.",
  },
  {
    id: "ai_15",
    category: "ai_agentic",
    categoryLabel: "AI & AGENTS",
    badgeColor: "#38bdf8",
    text: "Autonomous agent evaluators (LLM-as-a-judge) need strict rubrics, few-shot anchor calibrations, and position-bias swaps to prevent scoring drift.",
  },
  {
    id: "ai_16",
    category: "ai_agentic",
    categoryLabel: "AI & AGENTS",
    badgeColor: "#38bdf8",
    text: "Function calling without JSON mode is playing Russian roulette with your parser. Always enforce grammar-constrained decoding at the sampler level!",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 2. SYSTEMS, OS & HARDWARE (16 items)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "sys_1",
    category: "systems_security",
    categoryLabel: "SYSTEMS & SEC",
    badgeColor: "#10b981",
    text: "MicroVM sandboxing isolates untrusted user execution in under 12 milliseconds using hardware virtualization.",
  },
  {
    id: "sys_2",
    category: "systems_security",
    categoryLabel: "SYSTEMS & SEC",
    badgeColor: "#10b981",
    text: "Zero-standing privileges: developers lease temporary cloud IAM tokens that self-destruct after 15 minutes.",
  },
  {
    id: "sys_3",
    category: "systems_security",
    categoryLabel: "SYSTEMS & SEC",
    badgeColor: "#10b981",
    text: "Direct NVMe I/O streaming bypasses kernel copy overhead when paging multi-gigabyte Mixture-of-Experts weights.",
  },
  {
    id: "sys_4",
    category: "systems_security",
    categoryLabel: "SYSTEMS & SEC",
    badgeColor: "#10b981",
    text: "Ever run quantized LLMs on bare-metal ESP32 microcontrollers? Memory registers get cozy real fast!",
  },
  {
    id: "sys_5",
    category: "systems_security",
    categoryLabel: "SYSTEMS & SEC",
    badgeColor: "#10b981",
    text: "Zero-Knowledge Proof biometric passkeys let you verify your identity mathematically without transmitting credentials.",
  },
  {
    id: "sys_6",
    category: "systems_security",
    categoryLabel: "SYSTEMS & SEC",
    badgeColor: "#10b981",
    text: "eBPF runs sandboxed bytecode directly inside the Linux kernel, observing network packets and syscalls without touching kernel source.",
  },
  {
    id: "sys_7",
    category: "systems_security",
    categoryLabel: "SYSTEMS & SEC",
    badgeColor: "#10b981",
    text: "Cache line false sharing happens when two threads mutate distinct variables on the exact same 64-byte L1 cache line, thrashing CPU buses.",
  },
  {
    id: "sys_8",
    category: "systems_security",
    categoryLabel: "SYSTEMS & SEC",
    badgeColor: "#10b981",
    text: "The Raft consensus algorithm guarantees high-availability distributed state machines across split-brain networks using randomized election timers.",
  },
  {
    id: "sys_9",
    category: "systems_security",
    categoryLabel: "SYSTEMS & SEC",
    badgeColor: "#10b981",
    text: "SIMD AVX-512 vector registers process 16 single-precision floats in a single clock cycle. Parallelism down at the silicon wire level!",
  },
  {
    id: "sys_10",
    category: "systems_security",
    categoryLabel: "SYSTEMS & SEC",
    badgeColor: "#10b981",
    text: "Memory barriers prevent out-of-order CPU execution pipelines from reordering atomic store operations across multicore caches.",
  },
  {
    id: "sys_11",
    category: "systems_security",
    categoryLabel: "SYSTEMS & SEC",
    badgeColor: "#10b981",
    text: "Linux cgroups v2 and namespaces are the actual magic behind Docker containers — there is no such thing as an isolated 'container' kernel!",
  },
  {
    id: "sys_12",
    category: "systems_security",
    categoryLabel: "SYSTEMS & SEC",
    badgeColor: "#10b981",
    text: "Rowhammer attacks induce electromagnetic crosstalk in adjacent DRAM capacitor rows by repeatedly hammering memory addresses.",
  },
  {
    id: "sys_13",
    category: "systems_security",
    categoryLabel: "SYSTEMS & SEC",
    badgeColor: "#10b981",
    text: "Copy-On-Write (COW) memory paging lets `fork()` spawn child processes near instantly by sharing physical pages until one writes data.",
  },
  {
    id: "sys_14",
    category: "systems_security",
    categoryLabel: "SYSTEMS & SEC",
    badgeColor: "#10b981",
    text: "TCP BBR congestion control measures bottleneck bandwidth and round-trip delays directly, completely replacing loss-based packet drops.",
  },
  {
    id: "sys_15",
    category: "systems_security",
    categoryLabel: "SYSTEMS & SEC",
    badgeColor: "#10b981",
    text: "Address Space Layout Randomization (ASLR) randomizes stack, heap, and library memory offsets on every boot to thwart buffer overflow exploits.",
  },
  {
    id: "sys_16",
    category: "systems_security",
    categoryLabel: "SYSTEMS & SEC",
    badgeColor: "#10b981",
    text: "Zero-copy `sendfile()` streams file descriptors directly from filesystem cache to network sockets without crossing into user space.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 3. ASTROPHYSICS & THEORETICAL PHYSICS (16 items)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "astro_1",
    category: "astrophysics_science",
    categoryLabel: "ASTROPHYSICS",
    badgeColor: "#c084fc",
    text: "Hawking radiation proves black holes aren't eternal — quantum vacuum fluctuations slowly boil them away over googols of years!",
  },
  {
    id: "astro_2",
    category: "astrophysics_science",
    categoryLabel: "QUANTUM",
    badgeColor: "#c084fc",
    text: "Quantum entanglement doesn't violate relativity: spooky action across space cannot transmit classical data faster than light.",
  },
  {
    id: "astro_3",
    category: "astrophysics_science",
    categoryLabel: "COSMOLOGY",
    badgeColor: "#c084fc",
    text: "The Cosmic Microwave Background is 2.725 Kelvin static left over from the Big Bang. Some TV static is literally ancient universe echo!",
  },
  {
    id: "astro_4",
    category: "astrophysics_science",
    categoryLabel: "RELATIVITY",
    badgeColor: "#c084fc",
    text: "Gravitational time dilation is real: GPS satellites run 38 microseconds faster per day than clocks on Earth's surface.",
  },
  {
    id: "astro_5",
    category: "astrophysics_science",
    categoryLabel: "PHYSICS",
    badgeColor: "#c084fc",
    text: "At the event horizon of a supermassive black hole, tidal forces are gentle enough that you could drift right across without feeling torn!",
  },
  {
    id: "astro_6",
    category: "astrophysics_science",
    categoryLabel: "COSMOLOGY",
    badgeColor: "#c084fc",
    text: "Dark energy makes up ~68% of the universe and is accelerating the expansion of space-time itself into an eventual cold heat death.",
  },
  {
    id: "astro_7",
    category: "astrophysics_science",
    categoryLabel: "QUANTUM",
    badgeColor: "#c084fc",
    text: "The quantum eraser experiment shows that even after a photon passes double slits, deleting its path information restores wave interference patterns!",
  },
  {
    id: "astro_8",
    category: "astrophysics_science",
    categoryLabel: "ASTROPHYSICS",
    badgeColor: "#c084fc",
    text: "Neutron stars are so dense that a single teaspoon of their core material would weigh approximately 6 billion tons on Earth.",
  },
  {
    id: "astro_9",
    category: "astrophysics_science",
    categoryLabel: "PHYSICS",
    badgeColor: "#c084fc",
    text: "LIGO detected gravitational waves stretching space by less than 1/10,000th the diameter of a single proton across a 4-kilometer laser arm!",
  },
  {
    id: "astro_10",
    category: "astrophysics_science",
    categoryLabel: "COSMOLOGY",
    badgeColor: "#c084fc",
    text: "Due to cosmic expansion, galaxies outside our local Virgo Supercluster will eventually recede faster than light, vanishing from future night skies forever.",
  },
  {
    id: "astro_11",
    category: "astrophysics_science",
    categoryLabel: "ASTROPHYSICS",
    badgeColor: "#c084fc",
    text: "The James Webb Space Telescope orbits the Sun at the Second Lagrange Point (L2), 1.5 million kilometers behind Earth in perpetual solar shadow.",
  },
  {
    id: "astro_12",
    category: "astrophysics_science",
    categoryLabel: "RELATIVITY",
    badgeColor: "#c084fc",
    text: "Frame-dragging (the Lense-Thirring effect) means a spinning black hole literally drags the fabric of space-time around with it like honey on a spoon.",
  },
  {
    id: "astro_13",
    category: "astrophysics_science",
    categoryLabel: "QUANTUM",
    badgeColor: "#c084fc",
    text: "Heisenberg's Uncertainty Principle is not an instrument flaw; it is a fundamental wave mechanics truth — position and momentum are Fourier transforms of each other.",
  },
  {
    id: "astro_14",
    category: "astrophysics_science",
    categoryLabel: "ASTROPHYSICS",
    badgeColor: "#c084fc",
    text: "A pulsar is a rotating neutron star emitting lighthouse beams of radiation with precision rivaling atomic clocks.",
  },
  {
    id: "astro_15",
    category: "astrophysics_science",
    categoryLabel: "PHYSICS",
    badgeColor: "#c084fc",
    text: "The thermodynamic arrow of time exists only because the early universe began in a state of extraordinarily low gravitational entropy.",
  },
  {
    id: "astro_16",
    category: "astrophysics_science",
    categoryLabel: "QUANTUM",
    badgeColor: "#c084fc",
    text: "Quantum tunneling allows alpha particles to escape atomic nuclei by literally walking through an energy barrier higher than their total energy.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 4. GAMING LORE & ENGINE PHYSICS (16 items)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "game_1",
    category: "gaming_lore",
    categoryLabel: "GAME TECH",
    badgeColor: "#f59e0b",
    text: "Quake's famous bunny hopping originated from vector projection math — air acceleration unintentionally scaled sideways velocity!",
  },
  {
    id: "game_2",
    category: "gaming_lore",
    categoryLabel: "GAME TECH",
    badgeColor: "#f59e0b",
    text: "Super Mario 64's Backwards Long Jump (BLJ) exploits a missing negative speed cap when Mario long jumps backwards uphill.",
  },
  {
    id: "game_3",
    category: "gaming_lore",
    categoryLabel: "GAME TECH",
    badgeColor: "#f59e0b",
    text: "Minecraft's Far Lands were caused by 32-bit floating-point precision running out at coordinate X/Z ±12,550,821.",
  },
  {
    id: "game_4",
    category: "gaming_lore",
    categoryLabel: "GAME TECH",
    badgeColor: "#f59e0b",
    text: "Geometry Dash physics tick at 240Hz internally to prevent frame-rate dependent jump arc variations across monitors.",
  },
  {
    id: "game_5",
    category: "gaming_lore",
    categoryLabel: "GAME TECH",
    badgeColor: "#f59e0b",
    text: "DOOM (1993) ran on 386 CPUs using Binary Space Partitioning (BSP) trees to render complex 3D environments without needing depth z-buffers.",
  },
  {
    id: "game_6",
    category: "gaming_lore",
    categoryLabel: "GAME TECH",
    badgeColor: "#f59e0b",
    text: "In Half-Life 2, speedrunners turn around backwards and jump down slopes (Accelerated Back Hopping) because reverse acceleration has zero speed clamp.",
  },
  {
    id: "game_7",
    category: "gaming_lore",
    categoryLabel: "GAME TECH",
    badgeColor: "#f59e0b",
    text: "Zelda: Ocarina of Time Arbitrary Code Execution (ACE) lets players overwrite the N64 game loop in RAM using specifically arranged item inventory bytes!",
  },
  {
    id: "game_8",
    category: "gaming_lore",
    categoryLabel: "GAME TECH",
    badgeColor: "#f59e0b",
    text: "Celeste's physics engine gives you 5 coyote frames: you can still jump for 80 milliseconds after walking completely off a cliff edge!",
  },
  {
    id: "game_9",
    category: "gaming_lore",
    categoryLabel: "GAME TECH",
    badgeColor: "#f59e0b",
    text: "In Street Fighter II, combos were an unintentional bug! Canceling normal animation recovery into special moves was left in because the team found it fun.",
  },
  {
    id: "game_10",
    category: "gaming_lore",
    categoryLabel: "GAME TECH",
    badgeColor: "#f59e0b",
    text: "GoldenEye 007's guard AI reacted to gunshot audio spheres that expanded outward in 3D space, triggering nearby room alerts dynamically.",
  },
  {
    id: "game_11",
    category: "gaming_lore",
    categoryLabel: "GAME TECH",
    badgeColor: "#f59e0b",
    text: "In Portal, rendering infinite recursion portals without crashing GPU buffers is solved by rendering only 9 portal levels deep before stopping.",
  },
  {
    id: "game_12",
    category: "gaming_lore",
    categoryLabel: "GAME TECH",
    badgeColor: "#f59e0b",
    text: "Space Invaders' alien marching sped up not because of code, but because fewer aliens left on screen meant the CPU had less rendering load per frame!",
  },
  {
    id: "game_13",
    category: "gaming_lore",
    categoryLabel: "GAME TECH",
    badgeColor: "#f59e0b",
    text: "Super Smash Bros. Melee's 'Wavedash' is a physics consequence of directional air-dodging into the floor: friction converts air momentum into a ground slide.",
  },
  {
    id: "game_14",
    category: "gaming_lore",
    categoryLabel: "GAME TECH",
    badgeColor: "#f59e0b",
    text: "Pac-Man's ghosts have distinct algorithmic personalities: Blinky chases directly, Pinky targets 4 tiles ahead, and Inky calculates vectors off Blinky!",
  },
  {
    id: "game_15",
    category: "gaming_lore",
    categoryLabel: "GAME TECH",
    badgeColor: "#f59e0b",
    text: "In The Elder Scrolls: Skyrim, the moving opening intro cart was actually programmed as an NPC wearing a cart model as a helmet!",
  },
  {
    id: "game_16",
    category: "gaming_lore",
    categoryLabel: "GAME TECH",
    badgeColor: "#f59e0b",
    text: "World of Warcraft's 2005 Corrupted Blood plague accidentally became an epidemiological benchmark: real disease scientists studied how virtual players spread the contagion.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 5. MATHEMATICS & COMPUTING HISTORY (16 items)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "math_1",
    category: "math_computing_history",
    categoryLabel: "MATH & HISTORY",
    badgeColor: "#ec4899",
    text: "The magic constant 0x5f3759df in Quake III computes fast inverse square roots via direct IEEE-754 bit manipulation and one Newton-Raphson step.",
  },
  {
    id: "math_2",
    category: "math_computing_history",
    categoryLabel: "MATH & HISTORY",
    badgeColor: "#ec4899",
    text: "The Collatz Conjecture (3n+1) is so deceptively simple yet unproven that Paul Erdős warned: 'Mathematics is not yet ripe for such problems.'",
  },
  {
    id: "math_3",
    category: "math_computing_history",
    categoryLabel: "MATH & HISTORY",
    badgeColor: "#ec4899",
    text: "Gödel's Incompleteness Theorems proved that any consistent mathematical system capable of arithmetic contains true statements that cannot be proven inside it.",
  },
  {
    id: "math_4",
    category: "math_computing_history",
    categoryLabel: "MATH & HISTORY",
    badgeColor: "#ec4899",
    text: "Apollo 11's guidance computer had 72 kilobytes of ROM woven literally by hand into magnetic core rope memory by seamstresses dubbed 'LOL' (Little Old Ladies)!",
  },
  {
    id: "math_5",
    category: "math_computing_history",
    categoryLabel: "MATH & HISTORY",
    badgeColor: "#ec4899",
    text: "P vs NP asks whether every problem whose solution can be verified quickly by a computer can also be solved quickly. It carries a $1,000,000 Millennium prize!",
  },
  {
    id: "math_6",
    category: "math_computing_history",
    categoryLabel: "MATH & HISTORY",
    badgeColor: "#ec4899",
    text: "Claude Shannon's 1948 master's thesis proved that electrical switches and relays could solve Boolean logic, birthing digital circuit design.",
  },
  {
    id: "math_7",
    category: "math_computing_history",
    categoryLabel: "MATH & HISTORY",
    badgeColor: "#ec4899",
    text: "Alan Turing conceived the universal Turing machine in 1936 to resolve David Hilbert's Entscheidungsproblem (the decision problem).",
  },
  {
    id: "math_8",
    category: "math_computing_history",
    categoryLabel: "MATH & HISTORY",
    badgeColor: "#ec4899",
    text: "Euler's Identity e^(i*pi) + 1 = 0 combines the five most fundamental constants in mathematics (e, i, pi, 1, 0) in one sublime equation.",
  },
  {
    id: "math_9",
    category: "math_computing_history",
    categoryLabel: "MATH & HISTORY",
    badgeColor: "#ec4899",
    text: "The first computer bug was an actual real moth trapped in Relay 70 of Harvard's Mark II computer in 1947, taped into Grace Hopper's logbook.",
  },
  {
    id: "math_10",
    category: "math_computing_history",
    categoryLabel: "MATH & HISTORY",
    badgeColor: "#ec4899",
    text: "RSA encryption relies entirely on the asymmetry between multiplying two prime numbers (trivial) and factoring their giant product (practically impossible).",
  },
  {
    id: "math_11",
    category: "math_computing_history",
    categoryLabel: "MATH & HISTORY",
    badgeColor: "#ec4899",
    text: "The Banach-Tarski Paradox proves that using the Axiom of Choice, you can slice a solid 3D sphere into 5 pieces and reassemble them into two identical spheres!",
  },
  {
    id: "math_12",
    category: "math_computing_history",
    categoryLabel: "MATH & HISTORY",
    badgeColor: "#ec4899",
    text: "Ada Lovelace wrote the world's first computer algorithm in 1843 for Charles Babbage's Analytical Engine, calculating Bernoulli numbers.",
  },
  {
    id: "math_13",
    category: "math_computing_history",
    categoryLabel: "MATH & HISTORY",
    badgeColor: "#ec4899",
    text: "Information theory's Shannon Entropy formula H(X) = -sum(P(x) * log2 P(x)) quantifies the fundamental limit of data compression.",
  },
  {
    id: "math_14",
    category: "math_computing_history",
    categoryLabel: "MATH & HISTORY",
    badgeColor: "#ec4899",
    text: "The Halting Problem proves there can never exist a general algorithm that inspects arbitrary code and tells you if it will finish running or loop forever.",
  },
  {
    id: "math_15",
    category: "math_computing_history",
    categoryLabel: "MATH & HISTORY",
    badgeColor: "#ec4899",
    text: "The birthday paradox shows that in a room of just 23 people, there is over a 50% probability that two people share the exact same birthday.",
  },
  {
    id: "math_16",
    category: "math_computing_history",
    categoryLabel: "MATH & HISTORY",
    badgeColor: "#ec4899",
    text: "Benoit Mandelbrot's fractal z = z^2 + c generates infinite boundary complexity from a formula with only three operations.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 6. CULT RETRO SCI-FI LORE (12 items)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "scifi_1",
    category: "retro_scifi_lore",
    categoryLabel: "SCI-FI LORE",
    badgeColor: "#06b6d4",
    text: "HAL 9000's famous line 'I'm sorry, Dave, I'm afraid I can't do that' was born because HAL was trapped between a secret mission order and telling the truth.",
  },
  {
    id: "scifi_2",
    category: "retro_scifi_lore",
    categoryLabel: "SCI-FI LORE",
    badgeColor: "#06b6d4",
    text: "In Hitchhiker's Guide to the Galaxy, the answer to the Ultimate Question of Life, the Universe, and Everything is 42. Too bad nobody knows the question!",
  },
  {
    id: "scifi_3",
    category: "retro_scifi_lore",
    categoryLabel: "SCI-FI LORE",
    badgeColor: "#06b6d4",
    text: "William Gibson coined the word 'cyberspace' in Neuromancer (1984), describing it as 'a consensual hallucination experienced daily by billions of legitimate operators.'",
  },
  {
    id: "scifi_4",
    category: "retro_scifi_lore",
    categoryLabel: "SCI-FI LORE",
    badgeColor: "#06b6d4",
    text: "Interstellar's black hole Gargantua was rendered using real general relativity ray-tracing equations, resulting in the publication of actual scientific astrophysics papers!",
  },
  {
    id: "scifi_5",
    category: "retro_scifi_lore",
    categoryLabel: "SCI-FI LORE",
    badgeColor: "#06b6d4",
    text: "Blade Runner's 'Tears in rain' monologue was famously polished on set by Rutger Hauer the night before filming.",
  },
  {
    id: "scifi_6",
    category: "retro_scifi_lore",
    categoryLabel: "SCI-FI LORE",
    badgeColor: "#06b6d4",
    text: "Isaac Asimov's Three Laws of Robotics were designed not as a foolproof safeguard, but as a deliberate plot device that inevitably produces moral paradoxes.",
  },
  {
    id: "scifi_7",
    category: "retro_scifi_lore",
    categoryLabel: "SCI-FI LORE",
    badgeColor: "#06b6d4",
    text: "In Solaris, Stanislaw Lem reminds us: 'We don't want to conquer the cosmos, we simply want to extend the boundaries of Earth to the frontiers of the cosmos.'",
  },
  {
    id: "scifi_8",
    category: "retro_scifi_lore",
    categoryLabel: "SCI-FI LORE",
    badgeColor: "#06b6d4",
    text: "The monoliths in 2001: A Space Odyssey have dimensions strictly proportioned 1:4:9 — the squares of the first three integers.",
  },
  {
    id: "scifi_9",
    category: "retro_scifi_lore",
    categoryLabel: "SCI-FI LORE",
    badgeColor: "#06b6d4",
    text: "Frank Herbert's Dune features the Butlerian Jihad: 'Thou shalt not make a machine in the likeness of a human mind.'",
  },
  {
    id: "scifi_10",
    category: "retro_scifi_lore",
    categoryLabel: "SCI-FI LORE",
    badgeColor: "#06b6d4",
    text: "The Matrix green digital rain code was actually made of reversed Katakana characters and numbers sampled directly from Japanese sushi cookbook recipes!",
  },
  {
    id: "scifi_11",
    category: "retro_scifi_lore",
    categoryLabel: "SCI-FI LORE",
    badgeColor: "#06b6d4",
    text: "Contact's Prime Number transmission sequence is based on Carl Sagan's proof that prime numbers are the only universal mathematical language free from linguistic bias.",
  },
  {
    id: "scifi_12",
    category: "retro_scifi_lore",
    categoryLabel: "SCI-FI LORE",
    badgeColor: "#06b6d4",
    text: "Tachyon beams: in science fiction, particles that travel backwards in time because their velocity exceeds c in imaginary number coordinates.",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 7. CADET QUIPS & FOURTH-WALL HUMOR (14 items)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: "quip_1",
    category: "cadet_quips",
    categoryLabel: "CADET LOG",
    badgeColor: "#fbbf24",
    text: "Cadet rule #1: Never drink freeze-dried espresso during a high-G orbital slingshot. Visor cleanup takes hours.",
  },
  {
    id: "quip_2",
    category: "cadet_quips",
    categoryLabel: "CADET LOG",
    badgeColor: "#fbbf24",
    text: "A cosmic ray just flipped bit 7 in my auxiliary thruster firmware. That explains that sudden barrel roll earlier!",
  },
  {
    id: "quip_3",
    category: "cadet_quips",
    categoryLabel: "CADET LOG",
    badgeColor: "#fbbf24",
    text: "Warning: Starlight magnetic cursor detected nearby. Please do not tease the navigational sensors!",
  },
  {
    id: "quip_4",
    category: "cadet_quips",
    categoryLabel: "CADET LOG",
    badgeColor: "#fbbf24",
    text: "Fun fact: My pixel jetpack runs on 100% renewable cyber-plasma and pure late-night algorithmic caffeine.",
  },
  {
    id: "quip_5",
    category: "cadet_quips",
    categoryLabel: "CADET LOG",
    badgeColor: "#fbbf24",
    text: "Hold click anywhere on screen to activate my orbital summon tether! I'll brake physics to meet you.",
  },
  {
    id: "quip_6",
    category: "cadet_quips",
    categoryLabel: "CADET LOG",
    badgeColor: "#fbbf24",
    text: "I tried inspecting this website's DOM once. Found 42 nested div tags and a CSS grid that looked like an alien stargate.",
  },
  {
    id: "quip_7",
    category: "cadet_quips",
    categoryLabel: "CADET LOG",
    badgeColor: "#fbbf24",
    text: "Cadet confession: I use the project graph constellations to navigate. Don't tell mission control!",
  },
  {
    id: "quip_8",
    category: "cadet_quips",
    categoryLabel: "CADET LOG",
    badgeColor: "#fbbf24",
    text: "If you click me, you can start the Speed Run tour. I fly ahead and review Taanush's best projects!",
  },
  {
    id: "quip_9",
    category: "cadet_quips",
    categoryLabel: "CADET LOG",
    badgeColor: "#fbbf24",
    text: "My helmet visor is running at 60 FPS. Anything less causes severe spatial quantum dissonance.",
  },
  {
    id: "quip_10",
    category: "cadet_quips",
    categoryLabel: "CADET LOG",
    badgeColor: "#fbbf24",
    text: "Pro tip: You can drag and fling me across the viewport if you need a quick physics stress test.",
  },
  {
    id: "quip_11",
    category: "cadet_quips",
    categoryLabel: "CADET LOG",
    badgeColor: "#fbbf24",
    text: "The retro scanlines on this site are calibrated to CRT phosphor green. Feels just like retro home terminal 1984.",
  },
  {
    id: "quip_12",
    category: "cadet_quips",
    categoryLabel: "CADET LOG",
    badgeColor: "#fbbf24",
    text: "Currently calculating optimal orbital vectors... and by that I mean watching your cursor make circles.",
  },
  {
    id: "quip_13",
    category: "cadet_quips",
    categoryLabel: "CADET LOG",
    badgeColor: "#fbbf24",
    text: "Houston, we don't have a problem. The WebGL shaders are compiling smoothly without any memory leaks.",
  },
  {
    id: "quip_14",
    category: "cadet_quips",
    categoryLabel: "CADET LOG",
    badgeColor: "#fbbf24",
    text: "Every time a developer writes a clean unit test, an astronaut cadet gets their spatial navigation wings!",
  },
];

/**
 * Shuffle-bag algorithm: guarantees every dialogue in the pool plays once
 * before any dialogue repeats. When exhausted, it reshuffles the deck.
 */
export class DialogueShuffleBag {
  private pool: DialogueItem[];
  private bag: DialogueItem[] = [];
  private lastId: string | null = null;

  constructor(pool: DialogueItem[] = MASCOT_DIALOGUES) {
    this.pool = [...pool];
    this.refill();
  }

  private refill(): void {
    // Fisher-Yates shuffle
    const shuffled = [...this.pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Ensure the first item of the new bag is not identical to the last item of previous bag
    if (shuffled.length > 1 && shuffled[0].id === this.lastId) {
      const swapIdx = 1 + Math.floor(Math.random() * (shuffled.length - 1));
      [shuffled[0], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[0]];
    }

    this.bag = shuffled;
  }

  public next(): DialogueItem {
    if (this.bag.length === 0) {
      this.refill();
    }
    const item = this.bag.pop()!;
    this.lastId = item.id;
    return item;
  }

  public get totalCount(): number {
    return this.pool.length;
  }
}
