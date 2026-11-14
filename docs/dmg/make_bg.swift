import AppKit

// LilStudio DMG background (neo-brutalist, matches lilstudio.app).
// Usage: make_bg <icon.png> <AppName> <tagline> <hexColour> <outdir>
// Window 640×420; Finder icons at (170,220) and (470,220), 112 pt.
let a = CommandLine.arguments
let icon = NSImage(contentsOfFile: a[1])!
let name = a[2], tagline = a[3], outDir = a[5]

func hex(_ s: String) -> NSColor {
    let v = Int(s.replacingOccurrences(of: "#", with: ""), radix: 16)!
    return NSColor(srgbRed: CGFloat((v >> 16) & 255) / 255, green: CGFloat((v >> 8) & 255) / 255,
                   blue: CGFloat(v & 255) / 255, alpha: 1)
}
let primary = hex(a[4])
let cream = hex("F7F1DE"), card = hex("FFFBEF"), ink = hex("17150F"), muted = hex("55503F"), yellow = hex("FFE135")

let W: CGFloat = 640, H: CGFloat = 420

func font(_ size: CGFloat, _ weight: NSFont.Weight, mono: Bool = false) -> NSFont {
    if mono { return NSFont.monospacedSystemFont(ofSize: size, weight: weight) }
    return NSFont.systemFont(ofSize: size, weight: weight)
}

func render(scale: CGFloat, to outPath: String) {
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(W * scale), pixelsHigh: Int(H * scale),
                               bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                               colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    rep.size = NSSize(width: W, height: H)
    NSGraphicsContext.saveGraphicsState()
    let base = NSGraphicsContext(bitmapImageRep: rep)!
    let ctx = NSGraphicsContext(cgContext: base.cgContext, flipped: true)  // top-left origin, like Finder
    ctx.cgContext.translateBy(x: 0, y: H); ctx.cgContext.scaleBy(x: 1, y: -1)
    NSGraphicsContext.current = ctx

    cream.setFill(); NSRect(x: 0, y: 0, width: W, height: H).fill()

    // Faint grid, as behind every lilstudio.app page
    ink.withAlphaComponent(0.06).setFill()
    var g: CGFloat = 20
    while g < W { NSRect(x: g, y: 0, width: 1, height: H).fill(); g += 40 }
    g = 20
    while g < H { NSRect(x: 0, y: g, width: W, height: 1).fill(); g += 40 }

    // Header: icon + name with the 8px primary bar behind the wordmark
    let title = NSAttributedString(string: name, attributes: [.font: font(32, .heavy), .foregroundColor: ink])
    let ts = title.size()
    let iconS: CGFloat = 46, gap: CGFloat = 12
    let hx = (W - iconS - gap - ts.width) / 2, hy: CGFloat = 26
    icon.draw(in: NSRect(x: hx, y: hy, width: iconS, height: iconS), from: .zero, operation: .sourceOver,
              fraction: 1, respectFlipped: true, hints: nil)
    let tx = hx + iconS + gap, ty = hy + (iconS - ts.height) / 2
    primary.setFill()
    NSRect(x: tx - 2, y: ty + ts.height - 15, width: ts.width + 4, height: 9).fill()
    title.draw(at: NSPoint(x: tx, y: ty))

    let tag = NSAttributedString(string: tagline.uppercased(),
                                 attributes: [.font: font(11, .bold, mono: true), .foregroundColor: muted, .kern: 1.2])
    tag.draw(at: NSPoint(x: (W - tag.size().width) / 2, y: 84))

    // Two drop cards with hard offset shadows (Finder draws the icons + labels on top)
    func cardAt(_ cx: CGFloat, fill: NSColor, rot: CGFloat) {
        NSGraphicsContext.saveGraphicsState()
        let t = NSAffineTransform()
        t.translateX(by: cx, yBy: 222); t.rotate(byDegrees: rot); t.concat()
        let r = NSRect(x: -84, y: -86, width: 168, height: 172)
        ink.setFill(); NSBezierPath(roundedRect: r.offsetBy(dx: 6, dy: 6), xRadius: 18, yRadius: 18).fill()
        let p = NSBezierPath(roundedRect: r, xRadius: 18, yRadius: 18)
        fill.setFill(); p.fill()
        ink.setStroke(); p.lineWidth = 3; p.stroke()
        NSGraphicsContext.restoreGraphicsState()
    }
    cardAt(170, fill: primary.blended(withFraction: 0.55, of: card)!, rot: -1)
    cardAt(470, fill: card, rot: 1)

    // Chunky arrow: primary fill, ink outline, hard shadow
    func arrow(dx: CGFloat, dy: CGFloat) -> NSBezierPath {
        let y: CGFloat = 214 + dy, x0: CGFloat = 274 + dx, x1: CGFloat = 360 + dx
        let p = NSBezierPath()
        p.move(to: NSPoint(x: x0, y: y - 9)); p.line(to: NSPoint(x: x1 - 24, y: y - 9))
        p.line(to: NSPoint(x: x1 - 24, y: y - 22)); p.line(to: NSPoint(x: x1, y: y))
        p.line(to: NSPoint(x: x1 - 24, y: y + 22)); p.line(to: NSPoint(x: x1 - 24, y: y + 9))
        p.line(to: NSPoint(x: x0, y: y + 9)); p.close()
        p.lineJoinStyle = .round
        return p
    }
    ink.setFill(); arrow(dx: 4, dy: 4).fill()
    let ar = arrow(dx: 0, dy: 0)
    yellow.setFill(); ar.fill()
    ink.setStroke(); ar.lineWidth = 3; ar.stroke()

    // Footer badge
    let hint = NSAttributedString(string: "DRAG \(name.uppercased()) INTO APPLICATIONS",
                                  attributes: [.font: font(12, .bold, mono: true), .foregroundColor: ink, .kern: 1])
    let hs = hint.size()
    let badge = NSRect(x: (W - hs.width) / 2 - 16, y: 352, width: hs.width + 32, height: hs.height + 14)
    ink.setFill(); NSBezierPath(roundedRect: badge.offsetBy(dx: 4, dy: 4), xRadius: 8, yRadius: 8).fill()
    let bp = NSBezierPath(roundedRect: badge, xRadius: 8, yRadius: 8)
    yellow.setFill(); bp.fill(); ink.setStroke(); bp.lineWidth = 2.5; bp.stroke()
    hint.draw(at: NSPoint(x: badge.minX + 16, y: badge.minY + 7))

    NSGraphicsContext.restoreGraphicsState()
    try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: outPath))
}

render(scale: 1, to: outDir + "/background.png")
render(scale: 2, to: outDir + "/background@2x.png")
