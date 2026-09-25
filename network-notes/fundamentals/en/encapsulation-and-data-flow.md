---
title: "Encapsulation: How Data Transforms Through Each Layer"
description: "An image file doesn't travel straight from one machine to another — it gets 'wrapped' multiple times, each time adding a layer of information, before it actually hits the road."
tags: ["encapsulation", "data-flow", "fundamentals"]
date: "2025-7-1"
lang: "en"
weight: 4
locked: false
---

# Encapsulation: How Data Transforms Through Each Layer

In the OSI article, there was a detail mentioned but not fully explained: what does it concretely mean for data to "travel from Layer 7 down to Layer 1"? The answer is **encapsulation** — the process where each layer adds its own layer of information to the data, much like wrapping a package in multiple layers of packaging before sending it out.

![Data encapsulation OSI layers diagram](/media/notes/fundamentals/data-encap.png)

## Without encapsulation

If raw data were sent with no additional information at all, the receiving device would have no way of knowing: which application the data belongs to, which port it should be delivered to, what the destination IP address is, or which physical device on the local network it needs to be forwarded to. Without encapsulation, a stream of bits is just a stream of bits — carrying no instructions for the receiving system on how to process it.

## What is encapsulation?

Encapsulation is the process where each layer in a network model (OSI or TCP/IP) adds its own **header** to the front of the data received from the layer above it, before passing it down to the layer below. The reverse process — where data arrives and the headers are stripped away one by one at each corresponding layer — is called **de-encapsulation**.

The key thing to understand: each layer only reads and processes its own header, while the data inside (including the headers from the layers above it) is treated as a "black box" whose contents it doesn't need to care about.

## How encapsulation works through each layer

According to the TCP/IP model (4 layers), when an application sends data, the process happens in the following order:

1. **Application layer**: application data (for example, the content of an HTTP request) is created, called **data**.
2. **Transport layer**: adds a TCP or UDP header in front of the data — this header contains the source port, destination port, and (for TCP) a sequence number to ensure data arrives in the correct order. After this step, the data unit is called a **segment** (for TCP) or **datagram** (for UDP).
3. **Internet layer**: adds an IP header in front of the segment — containing the source and destination IP addresses. The data unit at this point is called a **packet**.
4. **Link layer**: adds a header containing the source and destination MAC addresses, along with a trailer used for error checking. The data unit at this point is called a **frame**.

After step 4, the frame is converted into electrical signals, light, or radio waves to be transmitted over the physical medium.

### Names of each data unit (PDU) by layer

The data unit at each layer has its own name, collectively called a **PDU (Protocol Data Unit)**. These are terms used consistently across the industry, including in IETF RFC documentation:

| Layer (TCP/IP) | PDU Name | What the header contains |
|---|---|---|
| Application | Data | Application content (HTTP request, email...) |
| Transport | Segment (TCP) / Datagram (UDP) | Source port, destination port, sequence number (TCP) |
| Internet | Packet | Source IP address, destination IP address |
| Link | Frame | Source MAC address, destination MAC address |

### On the receiving side: the process runs in reverse

When the frame arrives at the receiving device, de-encapsulation happens from Layer 1 up to Layer 4 (or Layer 1 up to Layer 7 in OSI terms):

1. The Link layer reads and strips the MAC header, confirms the frame is indeed addressed to it, and passes the remaining part (the packet) up to the layer above.
2. The Internet layer reads the IP header, confirms the destination IP is correct, and passes the segment/datagram up to the layer above.
3. The Transport layer reads the destination port in the header, determines which application on the machine should receive this data, and passes the data up to the Application layer.
4. The Application layer receives exactly the original data that the Application layer on the sending machine had created.

Because each layer only concerns itself with its own header, this process works correctly even if the two machines have completely different hardware, operating systems, or software — as long as both follow the same protocol standard at each layer.

## Analogy: encapsulation is like sending a parcel

An easy way to picture this: you put a letter (data) into a small envelope with the specific recipient's name written on it inside the house (similar to the Transport header specifying the port), that envelope is placed into a box with the full house address written on it (similar to the IP header specifying the network address), and that box is loaded onto a delivery truck with a specific route within the area written on it (similar to the MAC header used for delivery within the local network). The final recipient peels off each layer in the reverse order to get the original letter.

## Common misconceptions

- Confusing **packet** and **frame** — these two terms are not interchangeable: a packet is the unit at the Internet layer (containing the IP header), while a frame is the unit at the Link layer (containing the MAC header, and already including the packet inside it).
- Thinking that each layer "modifies" or "understands" the entire data — in reality, each layer only processes its own header portion, while the rest is treated as payload it doesn't need to care about.
- Overlooking the role of the trailer at the Link layer (usually an error-checking field called the FCS — Frame Check Sequence) — this is the only part added at the *end* of the data, unlike the other headers which are all added at the front.

#### Conclusion

Encapsulation is why one layer can change its technology (for example, switching from Wi-Fi to Ethernet at the Link layer) without any other layer needing to know about that change — each layer of packaging only needs to be correct at its own layer, without needing to care how the other layers are wrapped.