"use client"

import { useState, useEffect } from "react"

interface Industry {
    id: string
    name: string
    slug: string
    icon: string
    description: string
}

interface Props {
    value?: string
    onChange?: (slug: string) => void
}

export default function IndustrySelector({ value, onChange }: Props) {
    const [industries, setIndustries] = useState<Industry[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [selected, setSelected] = useState<Industry | null>(null)

    // 加载行业列表
    useEffect(() => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        fetch("/api/industries", { signal: controller.signal })
            .then(res => res.json())
            .then(data => {
                clearTimeout(timeoutId)
                setIndustries(data.industries || [])
                // 设置默认值
                if (value) {
                    const ind = (data.industries || []).find((i: Industry) => i.slug === value)
                    if (ind) setSelected(ind)
                } else if (data.industries?.length > 0) {
                    setSelected(data.industries[0])
                    onChange?.(data.industries[0].slug)
                }
            })
            .catch(err => {
                clearTimeout(timeoutId)
                console.warn("[IndustrySelector] Failed to load:", err instanceof Error ? err.message : String(err))
            })

        return () => {
            clearTimeout(timeoutId)
            controller.abort()
        }
    }, [value])

    const handleSelect = (industry: Industry) => {
        setSelected(industry)
        setIsOpen(false)
        onChange?.(industry.slug)
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2 border rounded-lg bg-card hover:bg-accent transition-colors flex items-center justify-between"
            >
                <span>{selected ? selected.name : "选择行业"}</span>
                <span className="text-sm">{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-card shadow-lg z-50 max-h-60 overflow-y-auto">
                    {industries.map(industry => (
                        <button
                            key={industry.id}
                            onClick={() => handleSelect(industry)}
                            className={`w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b last:border-b-0 ${
                                selected?.id === industry.id ? "bg-accent" : ""
                            }`}
                        >
                            <div>
                                <div className="font-medium">{industry.name}</div>
                                <div className="text-xs text-muted-foreground">{industry.description}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
