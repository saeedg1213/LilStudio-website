import AppKit

// LilUsage app icon in the LilStudio icon style: thick ink outline, flat fills,
// hard offset shadows. A menu bar with the usage pill, and the popover's two meters.
// Usage: lilusage_icon <out.png> [size]
let out = CommandLine.arguments[1]
let px = CommandLine.arguments.count > 2 ? Int(CommandLine.arguments[2])! : 1024

func hex(_ v: Int) -> NSColor {
    NSColor(srgbRed: CGFloat((v >> 16) & 255) / 255, green: CGFloat((v >> 8) & 255) / 255, blue: CGFloat(v & 255) / 255, alpha: 1)
}
let ink = hex(0x17150F), cream = hex(0xFBF3DD), track = hex(0xEADDB8)
let amber = hex(0xFFB020), coral = hex(0xFF6B5E), purple = hex(0xA98BFF), green = hex(0x3CE38B)

let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: px, pixelsHigh: px, bitsPerSample: 8, samplesPerPixel: 4,
                           hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
let base = NSGraphicsContext(bitmapImageRep: rep)!
let cg = base.cgContext
cg.scaleBy(x: CGFloat(px) / 1024, y: CGFloat(px) / 1024)
cg.translateBy(x: 0, y: 1024); cg.scaleBy(x: 1, y: -1)        // top-left origin
// Same margin as the other LilStudio icons (~9% each side)
cg.translateBy(x: 512, y: 512); cg.scaleBy(x: 0.86, y: 0.86); cg.translateBy(x: -512, y: -512)
NSGraphicsContext.current = NSGraphicsContext(cgContext: cg, flipped: true)

func rr(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat, _ r: CGFloat) -> NSBezierPath {
    NSBezierPath(roundedRect: NSRect(x: x, y: y, width: w, height: h), xRadius: r, yRadius: r)
}
func fillStroke(_ p: NSBezierPath, _ fill: NSColor, _ lw: CGFloat, shadow: CGFloat = 0) {
    if shadow > 0 {
        let s = p.copy() as! NSBezierPath
        s.transform(using: AffineTransform(translationByX: shadow, byY: shadow))
        ink.setFill(); s.fill()
    }
    fill.setFill(); p.fill()
    ink.setStroke(); p.lineWidth = lw; p.lineJoinStyle = .round; p.stroke()
}

// Body
let body = rr(42, 42, 940, 940, 220)
amber.setFill(); body.fill()

NSGraphicsContext.saveGraphicsState()
body.addClip()
// Menu bar
ink.setFill(); NSRect(x: 0, y: 0, width: 1024, height: 214).fill()
NSGraphicsContext.restoreGraphicsState()

// Menu bar extras: two dots on the left, the LilUsage pill in the middle
cream.withAlphaComponent(0.9).setFill()
NSBezierPath(ovalIn: NSRect(x: 168, y: 118, width: 40, height: 40)).fill()
NSBezierPath(ovalIn: NSRect(x: 230, y: 118, width: 40, height: 40)).fill()
let pill = rr(390, 104, 244, 70, 35)
cream.setFill(); pill.fill()
NSGraphicsContext.saveGraphicsState(); pill.addClip()
amber.setFill(); NSRect(x: 390, y: 104, width: 170, height: 70).fill()
NSGraphicsContext.restoreGraphicsState()
ink.setStroke(); pill.lineWidth = 14; pill.stroke()
// battery-like menu bar glyphs on the right
cream.withAlphaComponent(0.9).setFill()
rr(742, 120, 96, 44, 12).fill()
rr(842, 132, 10, 20, 4).fill()

// Popover arrow + card (hard shadow)
let card = rr(150, 300, 724, 560, 76)
let sh = card.copy() as! NSBezierPath; sh.transform(using: AffineTransform(translationByX: 30, byY: 30))
ink.setFill(); sh.fill()
cream.setFill(); card.fill()
ink.setStroke(); card.lineWidth = 38; card.stroke()
// Arrow: a cream wedge that opens the card's top edge, then its two sides
let wedge = NSBezierPath()
wedge.move(to: NSPoint(x: 425, y: 319)); wedge.line(to: NSPoint(x: 512, y: 232)); wedge.line(to: NSPoint(x: 599, y: 319)); wedge.close()
cream.setFill(); wedge.fill()
let edge = NSBezierPath()
edge.move(to: NSPoint(x: 444, y: 300)); edge.line(to: NSPoint(x: 512, y: 232)); edge.line(to: NSPoint(x: 580, y: 300))
edge.lineWidth = 38; edge.lineJoinStyle = .round; edge.lineCapStyle = .round; edge.stroke()

// Two meters: session (coral) and weekly (purple)
func meter(_ y: CGFloat, _ frac: CGFloat, _ color: NSColor) {
    let x: CGFloat = 236, w: CGFloat = 552, h: CGFloat = 116
    let p = rr(x, y, w, h, h / 2)
    track.setFill(); p.fill()
    NSGraphicsContext.saveGraphicsState(); p.addClip()
    color.setFill(); NSRect(x: x, y: y, width: w * frac, height: h).fill()
    ink.setFill(); NSRect(x: x + w * frac - 7, y: y, width: 14, height: h).fill()
    cream.withAlphaComponent(0.7).setFill(); rr(x + 44, y + 24, min(w * frac - 110, 150), 18, 9).fill()   // highlight
    NSGraphicsContext.restoreGraphicsState()
    ink.setStroke(); p.lineWidth = 30; p.stroke()
}
meter(410, 0.74, coral)
meter(612, 0.42, purple)

// Little "live" dot top-right of the card
fillStroke(NSBezierPath(ovalIn: NSRect(x: 754, y: 342, width: 44, height: 44)), green, 14)

// Outline last so it sits on top of everything
ink.setStroke(); body.lineWidth = 46; body.stroke()

try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: out))
