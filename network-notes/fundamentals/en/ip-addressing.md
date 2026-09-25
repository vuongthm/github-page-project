---
title: "IP Addresses: Structure and Classification"
description: "Every device on the Internet needs an address to be found — but how is that address structured, and why are some addresses 'unusable' outside the Internet?"
tags: ["ip", "addressing", "fundamentals"]
date: "2026-07-01"
lang: "en"
weight: 5
locked: false
---

# IP Addresses: Structure and Classification

In the article on encapsulation, the IP header appeared with the role of holding "the source and destination IP addresses" — but what actually is that address, how is it written, and why are there IP addresses that can never appear on the public Internet? These are questions anyone starting to configure a network will run into within the first few minutes.

![IPv4 address structure breakdown diagram by Octet and Binary](/media/notes/fundamentals/structure-ipddr.png)

## When two devices share the same address

Imagine a company network with 200 machines, but due to an oversight, two machines are configured with the same IP address. Both will immediately experience intermittent connection errors, or lose connection entirely — because the network system no longer has a way to determine exactly which machine the data should be sent to. This is called an **IP conflict**, and it's the clearest example of the fact that an IP address isn't a decorative name, but a unique identifier that must be accurate for the network to function.

## What is an IP address?

An IP address (Internet Protocol address) is a unique identifying number assigned to each device participating in a network that uses the IP protocol, used to identify that device during routing and data transmission. The most commonly used version today is **IPv4**, first defined in IETF's RFC 791 (1981).

## Structure of an IPv4 address

An IPv4 address consists of 32 bits, written as 4 groups of numbers separated by dots, called **dotted-decimal notation**. For example: `192.168.1.10`.

### From binary to decimal

Each group of numbers (called an **octet**, since it consists of exactly 8 bits) has a value from 0 to 255:

```
192      .  168      .  1        .  10
11000000 .  10101000 .  00000001 .  00001010
```

32 bits = 4 octets × 8 bits, and each octet can represent 2^8 = 256 different values (from 0 to 255) — this is why you'll never see an IPv4 address with an octet greater than 255.

### Network portion and Host portion

An IP address isn't a meaningless string of numbers — it's divided into 2 logical parts:

1. **Network portion**: the part that identifies which network this address belongs to.
2. **Host portion**: the part that identifies which specific device within that network.

The boundary between these two parts isn't fixed — it's determined by the **subnet mask**, and the details of how this boundary is calculated will be covered in the next article in the series (Subnetting). For this article, it's enough to understand the principle: an IP address is like a home address — the "street name, area" part is like the network portion, and the "specific house number" part is like the host portion.

## Classifying IP addresses by scope of use

Not every IP address can be used on the public Internet. The IETF, through RFC 1918, has reserved certain address ranges for internal use only, which cannot be routed onto the Internet:

| Type | Address range | Scope of use |
|---|---|---|
| Private (RFC 1918) | `10.0.0.0 – 10.255.255.255` | Large internal networks (enterprises) |
| Private (RFC 1918) | `172.16.0.0 – 172.31.255.255` | Medium-sized internal networks |
| Private (RFC 1918) | `192.168.0.0 – 192.168.255.255` | Small internal networks (home, small office) |
| Public | All remaining ranges (except special ranges) | Directly routable on the Internet |
| Loopback | `127.0.0.0 – 127.255.255.255` | A machine calling itself (`127.0.0.1` = localhost) |

### Why are separate private addresses needed?

IPv4 has a total of only about 4.3 billion addresses (2^32) — not enough to assign individually to every device worldwide, given that the number of Internet-connected devices has far exceeded that figure. The commonly used solution is to let each internal network (home, company) use the same private address range, and use **NAT** (Network Address Translation) to "translate" these private addresses into a shared public address when going out to the Internet. NAT will be its own topic in the Security & Optimization section of the series, as it's a fairly important technique that deserves detailed explanation.

### Broadcast Address

Within each network range, the last address (for example `192.168.1.255` in the `192.168.1.0/24` network) is reserved as the **broadcast** address — sending data to this address means sending it to all devices in that network simultaneously, not to one specific device.

## The difference with IPv6

IPv4 only has about 4.3 billion addresses, and this number has, in practice, run out in many regions since around 2011 (according to IANA's official announcement). This is why IPv6 was developed — with 128 bits instead of 32 bits, IPv6 provides a number of addresses that is essentially inexhaustible for the foreseeable future. IPv6 will have its own article in the series (Advanced section), since its structure and notation differ significantly from IPv4.

## Common mistakes

- Assigning the same IP address to 2 devices on the same network — causing an IP conflict, resulting in intermittent or complete loss of connection for both machines.
- Confusing a private address with a public address — attempting to access a private address (e.g. `192.168.1.10`) from outside the Internet will never succeed, because routers on the public Internet are configured not to route RFC 1918 ranges.
- Assigning the broadcast address or the network address (the first address in the range, e.g. `192.168.1.0`) to a specific device — these are 2 addresses with special roles and cannot be used for a regular host.

#### Conclusion

An IP address isn't just "a number to identify a machine" — it carries within it information about which network that machine belongs to, and the scope in which it's allowed to appear (private or public). Understanding this structure correctly is a required foundation before moving into subnetting — where the network/host portion boundary will be calculated concretely.