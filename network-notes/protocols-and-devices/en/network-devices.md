---
title: "Network Devices: Hub, Switch, Router, Access Point"
description: "They're all 'networking devices,' but hubs, switches, routers, and access points solve completely different problems — confusing them is the most common mistake when starting out in networking."
tags: ["devices", "hardware", "protocols"]
date: "2026-07-03"
lang: "en"
weight: 8
locked: false
---

# Network Devices: Hub, Switch, Router, Access Point

Up to this point, the series has covered the entire theoretical foundation: node, link, OSI, IP, port. But what actual hardware does that theory run on? This is the first article of Part 2, where the series starts connecting concepts to real devices — beginning with the 4 names that get mixed up the most: hub, switch, router, and access point.

![Hub, switch, router, access point comparison](/media/notes/protocols-and-devices/network-devices.png)
*Comparison of 4 common network devices, classified by the OSI layer at which each device operates.*

## When the wrong device is used

Imagine a 30-machine office still using a hub instead of a switch — because a hub sends data to *all* ports instead of just the destination port, all 30 machines will "hear" every packet sent across the network, even if that packet was meant for just one machine. The result is constant **collisions** (data conflicts) as multiple machines send data at the same time, making the network noticeably slower as the number of machines grows. This is why correctly understanding the role of each device isn't just theoretical knowledge — it directly affects real-world network performance.

## 4 devices, 4 different OSI layers

The most important thing to grasp: each of these devices operates at a different OSI layer, and that layer determines what the device can "see" in the data passing through it.

| Device | OSI Layer | What it uses to forward data | Current status |
|---|---|---|---|
| Hub | Layer 1 (Physical) | Nothing — just amplifies and sends to every port | Nearly out of production, fully replaced by switches |
| Switch | Layer 2 (Data Link) | MAC address | The standard device for modern LANs |
| Router | Layer 3 (Network) | IP address | The standard device for connecting different networks |
| Access Point | Layer 1/2 | Similar to a switch, but over Wi-Fi instead of cable | The standard device for extending wireless networks |

## How a hub works (and why it's nearly extinct)

A hub is the simplest device — when it receives a signal on one port, it amplifies and broadcasts that signal out to **all** the other ports, without distinguishing which port is the actual destination. All devices connected to a hub share a single **collision domain** — meaning only one device is allowed to send data at any given moment, otherwise a collision occurs. Because of this drawback, hubs have been almost completely removed from modern network infrastructure, replaced by switches.

## How a switch works

A switch is smarter than a hub in one key way: it builds and maintains a table called the **MAC address table**, keeping track of which MAC address is connected on which port. When it receives a frame, the switch reads the destination MAC address in the header, looks it up in the table, and sends that frame only to the corresponding port — instead of sending it to every port like a hub.

Thanks to this mechanism, each port on a switch is its own separate collision domain — multiple devices can send data at the same time without colliding with each other, as long as they're sending to different destinations. This is why a switch is many times more efficient than a hub in a network with many devices.

### When the switch doesn't yet know the destination MAC address

If a switch receives a frame whose destination MAC address has never appeared in its MAC address table, it will temporarily behave like a hub — sending that frame out to all ports (except the one it was received on), called **flooding**. When the destination device responds, the switch learns which port that MAC address is associated with, and from then on will send directly to it without needing to flood again.

## How a router works

A router operates at a higher layer than a switch — it reads the IP address in the header, not the MAC address, and uses this information to decide the path between different networks (not just within a single local network like a switch). A router maintains a **routing table**, recording the possible routes to other networks, and selects the most suitable route for each packet.

The core difference between a switch and a router: a switch forwards data **within the same network** (based on MAC), while a router forwards data **between different networks** (based on IP). This is also why, when connecting to the Internet at home, the "Wi-Fi modem/router" device is actually performing the job of a router — connecting the internal home network to the Internet service provider's network.

*More detail on how a router chooses paths (routing table, static/dynamic routing) will be covered in the next article in the series.*

## How an access point works

An Access Point (AP) plays a role similar to a switch, but for wireless connections — it receives data from the wired network (usually connected to a switch or router) and broadcasts Wi-Fi so wireless devices can join that same network. In essence, an AP is a "bridge" between wired infrastructure and wireless devices; it doesn't route between networks on its own the way a router does.

Many home devices (often collectively called a "Wi-Fi modem" or "Wi-Fi router") actually integrate all 3 functions — router, switch, and access point — into a single box. This is the reason for the common confusion that "router" and "Wi-Fi modem" are the same concept.

## Common mistakes

- Calling every home networking device a "router" — when in reality that device often integrates a router, switch, and access point into one, making it hard to accurately describe an issue (e.g. weak Wi-Fi vs. lost Internet connection) without being able to distinguish which function is having the problem.
- Confusing the roles of switch and router — thinking that a switch can also "route" between different networks, when a switch only operates within the scope of a single local network (based on MAC, not IP).
- Using a hub in a modern network (rare, but still found in some legacy systems) without realizing that the cause of the slow network is that all devices are sharing the same collision domain.

#### Conclusion

None of these 4 devices is absolutely "better" than the others — each one is designed to solve a problem at a specific layer of OSI. A switch solves the problem within a network, a router solves the problem between multiple networks, and an access point solves the problem of making wired infrastructure wireless. Knowing exactly which layer an issue is happening at is the first step to knowing which device to look at.