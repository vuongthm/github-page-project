---
title: "MAC Address and ARP"
description: "A switch forwards data based on MAC address — but an application only knows the IP address of the destination. ARP is the quiet link that connects these two addressing worlds together."
tags: ["mac", "arp", "layer2"]
date: "2026-07-03"
lang: "en"
weight: 9
locked: false
---

# MAC Address and ARP

In the previous article, a switch was described as forwarding data based on MAC address, while a router (and applications) work with IP addresses. But when machine A wants to send data to machine B on the same network, machine A only knows B's IP address — so how does it find the corresponding MAC address to get the switch to forward it to the right place? This is the job of **ARP**.

![ARP request and reply resolution process](/media/notes/protocols-and-devices/arp-resolution.png)
*The ARP process: machine A asks the whole network "who owns this IP", and only the actual owner of that IP replies with its own MAC address.*

## When two addresses don't speak the same language

Imagine machine A (`192.168.1.10`) wants to send data to machine B (`192.168.1.20`) on the same LAN. Machine A knows B's IP address, but the switch — the device that will actually forward the frame — doesn't care about IP addresses at all; it only reads MAC addresses. If there's no way for machine A to find the MAC address corresponding to B's IP, the frame can't be properly assembled, and the switch won't know where to send it.

## What is a MAC address?

A MAC address (Media Access Control address) is a 48-bit physical address permanently assigned to each network card (NIC — Network Interface Card) at the time of manufacture, usually written as 6 pairs of hex digits, for example `00:1A:2B:3C:4D:5E`. Unlike an IP address (which can change depending on which network the device is connected to), a MAC address is, in theory, globally unique and doesn't change with the network the device is on, because the first 24 bits (called the **OUI — Organizationally Unique Identifier**) are assigned by the IEEE to each individual hardware manufacturer.

### MAC address vs. IP address — two different addressing layers

| | MAC Address | IP Address |
|---|---|---|
| OSI Layer | Data Link (Layer 2) | Network (Layer 3) |
| Scope of operation | Within the same local network | Across multiple different networks |
| Can it change? | Fixed to the hardware (though it can be simulated/spoofed) | Changes depending on which network it's connected to |
| Length | 48 bits | 32 bits (IPv4) |

These two addressing layers exist side by side because they serve two different purposes: IP is used to route data over long distances across multiple networks, while MAC is used to precisely identify which device within the scope of a single local network.

## What is ARP?

ARP (Address Resolution Protocol), defined in RFC 826 (1982), is the protocol used to find the MAC address corresponding to a known IP address, within the scope of the same local network. In short: ARP is the bridge between the IP address layer and the MAC address layer.

## How ARP works

The ARP resolution process happens in the following steps:

1. Machine A needs to send data to `192.168.1.20`, but doesn't yet know the corresponding MAC address.
2. Machine A checks its own **ARP cache** (a table that temporarily stores previously known IP–MAC pairs) — if the entry already exists, it's used directly, and the following steps aren't needed.
3. If it's not in the cache, machine A sends an **ARP request** as a **broadcast** (sent to every device on the network), with content roughly equivalent to: "Who has IP address `192.168.1.20`? Please tell me your MAC address."
4. Every device on the network receives this ARP request, but only the device that actually owns that IP address (machine B) responds.
5. Machine B sends back an **ARP reply**, as a **unicast** (sent only to machine A), containing its own MAC address.
6. Machine A stores this IP–MAC pair in its ARP cache, and starts sending the actual data to machine B using the MAC address it just received.

### Why the ARP request must be a broadcast

At the moment the request is sent, machine A has no idea what machine B's MAC address is (that's exactly what it's trying to find) — so it can't send directly (unicast) to machine B, and is forced to ask the entire network at once. This is also why ARP only works within the scope of a single local network (broadcast domain) — a broadcast can't cross a router into another network.

## ARP cache — why temporary storage is needed

If the entire ARP request/reply process had to be repeated every single time data was sent, the network would waste a lot of bandwidth "re-asking" information it already knows. Because of this, each device maintains an ARP cache, temporarily storing IP–MAC pairs for a certain period of time (usually a few minutes, depending on the operating system), before they're removed and need to be resolved again if there's a need to send more data.

You can view the current ARP cache on most operating systems with the command:
```
arp -a
```

## Common mistakes and security risks

- **Stale ARP cache**: if a device changes its network card (resulting in a changed MAC), but other machines' ARP caches haven't been updated yet, data may be sent to the old MAC address, causing a temporary loss of connection until the cache expires and re-resolves.
- **ARP spoofing (or ARP poisoning)**: since ARP has no mechanism to authenticate the responder, a malicious device on the network can forge an ARP reply, falsely claiming to own an IP address that isn't actually its own — thereby tricking other machines into mistakenly sending data to it, enabling eavesdropping (man-in-the-middle attacks). This is why important enterprise networks often deploy additional protective mechanisms such as Dynamic ARP Inspection on switches.
- **Confusing the scope of operation**: thinking that ARP can resolve the MAC address of a device on a different network (over the Internet) — in reality, ARP only works within the same broadcast domain; communication between different networks is handled by routers, without needing cross-network ARP.

#### Conclusion

ARP is one of the most "quiet" protocols in networking — it runs at a very low layer, no one calls it directly, but almost all communication within a LAN depends on it working correctly. Understanding ARP means understanding how the IP and MAC addressing layers, which were designed independently of each other, are connected together into a unified system in practice.