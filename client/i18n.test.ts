import { describe, expect, it } from "vitest"
import { resolveLocale, t } from "./i18n"

describe("resolveLocale", () => {
  it("honors an explicit choice", () => {
    expect(resolveLocale("en")).toBe("en")
    expect(resolveLocale("zh")).toBe("zh")
  })

  it("detects something for automatic", () => {
    expect(["en", "zh"]).toContain(resolveLocale("auto"))
  })
})

describe("messages", () => {
  it("starts in English", () => {
    expect(t().common.retry).toBe("Retry")
    expect(t().market.title).toBe("Plugin directory")
  })

  it("has matching keys in both tables", () => {
    const walk = (value: unknown, path: string[] = []): string[] => {
      if (typeof value !== "object" || value === null) return [path.join(".")]
      return Object.entries(value).flatMap(([key, child]) =>
        walk(child, [...path, key])
      )
    }
    const keys = walk(t())
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).toContain("market.plugins")
    expect(keys).toContain("settings.language")
    expect(keys).toContain("installed.updateAvailable")
  })
})
