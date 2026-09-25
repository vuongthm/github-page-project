---
title: "Subnetting: Dividing to Manage"
description: "A large IP range can be divided into multiple smaller networks — subnetting is the technique that decides the network/host portion boundary mentioned in the previous article, and why such division is needed."
tags: ["subnetting", "fundamentals"]
date: "2026-7-2"
lang: "en"
weight: 6
locked: false
---

# Subnetting: Dividing to Manage

In the article on IP addresses, one question was left open: the boundary between the network portion and the host portion isn't fixed, but is determined by the **subnet mask**. This is exactly the topic of this article — subnetting, the technique that allows a large IP address range to be divided into multiple smaller networks, each smaller network managing its own group of devices.

![Subnet mask network host bits](/media/notes/fundamentals/subnet-mask.png)

## When a network isn't divided

Imagine a company with 1000 machines, all sitting in a single large network, undivided. Every device in that network is part of the same **broadcast domain** — meaning a broadcast packet (sent to everyone) from any machine gets sent to all 1000 other machines. As broadcast traffic increases (which naturally happens as more devices join), the entire network slows down, even for machines that have nothing to do with that packet. This is why large networks always need to be divided.

## What is subnetting?

Subnetting is the process of dividing an IP address range (a network) into multiple smaller ranges (called **subnets**), by "borrowing" a number of bits from the host portion to turn them into an extension of the network portion. This is done through the **subnet mask** — a 32-bit sequence used to determine which bits belong to the network portion and which belong to the host portion.

## How the subnet mask works

The subnet mask has the same length as the IP address (32 bits for IPv4), where a `1` bit represents the network portion, and a `0` bit represents the host portion.

```
IP address:   192.168.1.10   → 11000000.10101000.00000001.00001010
Subnet mask:  255.255.255.0  → 11111111.11111111.11111111.00000000
                                └────── network ──────┘└─ host ─┘
```

In this example, the first 24 bits (first 3 octets) are the network portion, and the last 8 bits are the host portion — meaning this network can hold a maximum of 2^8 = 256 host addresses (minus 2 special addresses, the network address and the broadcast address, leaving 254 addresses actually usable).

### CIDR notation — a more compact way to write it

Instead of writing out the full subnet mask (`255.255.255.0`), the more common notation in practice is **CIDR notation** (Classless Inter-Domain Routing, defined in RFC 4632) — you just need to write the number of network portion bits after a slash:

```
192.168.1.10/24
```

This means the first 24 bits are the network portion — equivalent to the subnet mask `255.255.255.0`. This notation is shorter, and is the standard used in most documentation, router configurations, and modern networking tools.

### Common CIDR table

| CIDR | Subnet mask | Number of host portion bits | Number of usable host addresses |
|---|---|---|---|
| /24 | 255.255.255.0 | 8 | 254 |
| /25 | 255.255.255.128 | 7 | 126 |
| /26 | 255.255.255.192 | 6 | 62 |
| /27 | 255.255.255.224 | 5 | 30 |
| /28 | 255.255.255.240 | 4 | 14 |

General formula: number of usable host addresses = 2^(number of host bits) − 2 (subtracting the network address and broadcast address of that subnet).

## A concrete subnet calculation example

Suppose there's a network range `192.168.1.0/24` (256 addresses), and it needs to be divided into 4 smaller subnets for 4 departments. The approach: borrow 2 more bits from the host portion (since 2^2 = 4, enough to create 4 subnets), turning `/24` into `/26`:

| Subnet | Address range | Network address | Broadcast address |
|---|---|---|---|
| Subnet 1 | 192.168.1.0 – 192.168.1.63 | 192.168.1.0 | 192.168.1.63 |
| Subnet 2 | 192.168.1.64 – 192.168.1.127 | 192.168.1.64 | 192.168.1.127 |
| Subnet 3 | 192.168.1.128 – 192.168.1.191 | 192.168.1.128 | 192.168.1.191 |
| Subnet 4 | 192.168.1.192 – 192.168.1.255 | 192.168.1.192 | 192.168.1.255 |

Each /26 subnet has 2^6 = 64 addresses, of which 62 addresses are usable for hosts (excluding that subnet's own network address and broadcast address).

## VLSM — when subnets don't need to be equal

The division above creates 4 equally sized subnets — but in practice, departments usually have different numbers of machines. **VLSM (Variable Length Subnet Mask)** is a technique that allows dividing subnets of different sizes from the same large network range, avoiding wasted addresses. For example: the engineering department, needing 100 machines, could use a /25 subnet (126 usable addresses), while the reception department, needing only 5 machines, could use a /29 subnet (6 usable addresses) — instead of both being forced into the same /26 size as in the simple example above.

## Common mistakes

- Confusing the network address (the first address of a subnet, e.g. `192.168.1.0`) with an address that can be assigned to a device — the two special addresses (network address and broadcast address) of each subnet can never be assigned to a regular host.
- Miscalculating the number of bits that need to be borrowed when dividing into N subnets — the rule is to borrow enough bits so that 2^(number of borrowed bits) ≥ N, not simply calculating based on an intuitive equal division of subnets.
- Making subnets too small from the start (for example, using an entire /30 for a department that might expand) — when that department needs more machines, the entire network range will have to be re-planned, causing unnecessary disruption.

#### Conclusion

Subnetting isn't just a bit-calculation exercise — it's a tool for keeping large networks running smoothly, by limiting the scope of the broadcast domain and organizing addresses according to the actual organizational structure (departments, areas, functions). The network/host portion boundary isn't a fixed number — it's a design decision, and the subnet mask is the tool used to implement that decision.